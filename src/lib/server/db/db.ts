// db.ts - Gestion de la base de données SQLite pour les photos
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import { eq, sql, inArray, and, desc, asc } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { generateLexoRank, compareLexoRank } from "../utils/lexorank.js";
import * as schema from "./schema.js";
import type { Photo } from "$lib/types/photo.js";
import type { Tag } from "$lib/types/tag.js";

export const HIDDEN_TAG_NAME = "_hidden";

// Initialisation de la base de données
let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/** Récupère le chemin de la base de données (calculé dynamiquement pour les tests) */
function getDBPath(): string {
  return (
    process.env.DB_PATH ||
    path.join(process.cwd(), "gallery-data/data/photos.db")
  );
}

/** Ferme la connexion à la base de données (utile pour les tests) */
export function closeDB(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

/** Applique les migrations sur la base de données (utile pour les tests) */
export function runMigrations(): void {
  const database = getDB();
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  migrate(database, { migrationsFolder });
}

function getDB() {
  if (!db) {
    sqlite = new Database(getDBPath());
    db = drizzle(sqlite, { schema });
  }
  return db;
}

function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr-FR");
}

function isValidTagName(name: string): boolean {
  return /^[\p{L}\p{N} ]+$/u.test(name);
}

/**
 * Ajoute une photo à la base de données
 * Le lexoRank est généré automatiquement si absent
 */
export function addPhoto(
  filename: string,
  width: number,
  height: number,
  lexoRank: string | null = null,
): Photo {
  const database = getDB();

  let rank: string;
  if (lexoRank) {
    rank = lexoRank;
  } else {
    // Génère un LexoRank pour ajouter à la fin
    const lastPhoto = database
      .select({ lexoRank: schema.photos.lexoRank })
      .from(schema.photos)
      .orderBy(desc(schema.photos.lexoRank))
      .limit(1)
      .get();

    const lastRank = lastPhoto ? lastPhoto.lexoRank : null;
    rank = generateLexoRank(lastRank, null);
  }

  database
    .insert(schema.photos)
    .values({
      filename,
      width,
      height,
      lexoRank: rank,
    })
    .run();

  return {
    filename,
    width,
    height,
    lexoRank: rank,
  };
}

/** Supprime une photo de la base de données */
export function deletePhoto(filename: string): boolean {
  const database = getDB();
  const result = database
    .delete(schema.photos)
    .where(eq(schema.photos.filename, filename))
    .run();
  return result.changes > 0;
}

/** Récupère toutes les photos triées par LexoRank */
export function getAllPhotos(): Photo[] {
  const database = getDB();
  const photos = database
    .select()
    .from(schema.photos)
    .orderBy(asc(schema.photos.lexoRank))
    .all();

  // Récupère tous les tags associés aux photos
  const photoTagsData = database
    .select({
      photoFilename: schema.photoTags.photoFilename,
      tagId: schema.tags.id,
      tagName: schema.tags.name,
    })
    .from(schema.photoTags)
    .innerJoin(schema.tags, eq(schema.tags.id, schema.photoTags.tagId))
    .all();

  // Groupe les tags par photo
  const tagsByPhoto = new Map<string, Tag[]>();
  for (const pt of photoTagsData) {
    if (!tagsByPhoto.has(pt.photoFilename)) {
      tagsByPhoto.set(pt.photoFilename, []);
    }
    tagsByPhoto.get(pt.photoFilename)!.push({
      id: pt.tagId,
      name: pt.tagName,
    });
  }

  // Ajoute les tags à chaque photo
  return photos.map((photo) => ({
    ...photo,
    tags: tagsByPhoto.get(photo.filename) || [],
  }));
}

/** Récupère les photos visibles sur la page d'accueil (sans le tag système _hidden) */
export function getHomepagePhotos(): Photo[] {
  return getAllPhotos().filter(
    (photo) => !photo.tags?.some((tag) => tag.name === HIDDEN_TAG_NAME),
  );
}

/** Vérifie si une photo existe dans la DB */
export function photoExists(filename: string): boolean {
  const database = getDB();
  const result = database
    .select({ filename: schema.photos.filename })
    .from(schema.photos)
    .where(eq(schema.photos.filename, filename))
    .limit(1)
    .get();
  return result !== undefined;
}

/**
 * Déplace une photo dans l'ordre
 * prevFilename/nextFilename: null si début/fin
 */
export function reorderPhoto(
  filename: string,
  prevFilename: string | null,
  nextFilename: string | null,
): Photo {
  const database = getDB();

  // Vérifie que la photo existe
  const photo = database
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.filename, filename))
    .get();

  if (!photo) {
    throw new Error(`Photo ${filename} non trouvée`);
  }

  // Trouve les ranks précédent et suivant
  let prevRank: string | null = null;
  let nextRank: string | null = null;

  if (prevFilename) {
    const prev = database
      .select({ lexoRank: schema.photos.lexoRank })
      .from(schema.photos)
      .where(eq(schema.photos.filename, prevFilename))
      .get();
    prevRank = prev?.lexoRank || null;
  }

  if (nextFilename) {
    const next = database
      .select({ lexoRank: schema.photos.lexoRank })
      .from(schema.photos)
      .where(eq(schema.photos.filename, nextFilename))
      .get();
    nextRank = next?.lexoRank || null;
  }

  // Génère le nouveau rank
  const newRank = generateLexoRank(prevRank, nextRank);

  // Met à jour le rank de la photo
  database
    .update(schema.photos)
    .set({ lexoRank: newRank })
    .where(eq(schema.photos.filename, filename))
    .run();

  return {
    ...photo,
    lexoRank: newRank,
  };
}

// ========== GESTION DES TAGS ==========

/** Crée un nouveau tag */
export function createTag(name: string): Tag {
  const database = getDB();
  const normalizedName = normalizeTagName(name);

  if (normalizedName.length === 0) {
    throw new Error("Nom de tag invalide: le nom est requis");
  }

  if (!isValidTagName(normalizedName)) {
    throw new Error(
      "Nom de tag invalide: les caractères spéciaux ne sont pas autorisés",
    );
  }

  const existingTag = database
    .select({ id: schema.tags.id })
    .from(schema.tags)
    .where(sql`lower(${schema.tags.name}) = ${normalizedName}`)
    .limit(1)
    .get();

  if (existingTag) {
    throw new Error("Ce tag existe déjà");
  }

  const result = database
    .insert(schema.tags)
    .values({ name: normalizedName })
    .run();

  return {
    id: Number(result.lastInsertRowid),
    name: normalizedName,
  };
}

/** Supprime un tag (erreur si des photos l'utilisent) */
export function deleteTag(tagId: number): boolean {
  const database = getDB();

  // Vérifie si des photos utilisent ce tag
  const count = database
    .select({ count: sql<number>`count(*)` })
    .from(schema.photoTags)
    .where(eq(schema.photoTags.tagId, tagId))
    .get();

  if (count && count.count > 0) {
    throw new Error(
      `Impossible de supprimer le tag: ${count.count} photo(s) l'utilisent encore`,
    );
  }

  const result = database
    .delete(schema.tags)
    .where(eq(schema.tags.id, tagId))
    .run();
  return result.changes > 0;
}

/** Récupère tous les tags */
export function getAllTags(): Tag[] {
  const database = getDB();
  return database
    .select()
    .from(schema.tags)
    .orderBy(asc(schema.tags.name))
    .all();
}

/** Récupère un tag par son nom */
export function getTagByName(name: string): Tag | undefined {
  const database = getDB();

  const normalizedName = normalizeTagName(name);
  if (normalizedName.length === 0 || !isValidTagName(normalizedName)) {
    return undefined;
  }

  return database
    .select()
    .from(schema.tags)
    .where(sql`lower(${schema.tags.name}) = ${normalizedName}`)
    .limit(1)
    .get();
}

function getHiddenTag(): Tag | undefined {
  const database = getDB();
  return database
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.name, HIDDEN_TAG_NAME))
    .limit(1)
    .get();
}

function getOrCreateHiddenTag(): Tag {
  const database = getDB();
  const existingTag = getHiddenTag();
  if (existingTag) {
    return existingTag;
  }

  const result = database
    .insert(schema.tags)
    .values({ name: HIDDEN_TAG_NAME })
    .run();

  return {
    id: Number(result.lastInsertRowid),
    name: HIDDEN_TAG_NAME,
  };
}

/** Active/désactive le tag système _hidden pour une photo */
export function setPhotoHidden(photoFilename: string, hidden: boolean): void {
  const database = getDB();

  const photo = database
    .select({ filename: schema.photos.filename })
    .from(schema.photos)
    .where(eq(schema.photos.filename, photoFilename))
    .limit(1)
    .get();

  if (!photo) {
    throw new Error(`Photo ${photoFilename} non trouvée`);
  }

  const hiddenTag = getOrCreateHiddenTag();

  if (hidden) {
    addTagToPhoto(photoFilename, hiddenTag.id);
  } else {
    removeTagFromPhoto(photoFilename, hiddenTag.id);
  }
}

/** Indique si une photo est marquée avec le tag système _hidden */
export function isPhotoHidden(photoFilename: string): boolean {
  const database = getDB();
  const hiddenTag = getHiddenTag();

  if (!hiddenTag) {
    return false;
  }

  const relation = database
    .select({ photoFilename: schema.photoTags.photoFilename })
    .from(schema.photoTags)
    .where(
      and(
        eq(schema.photoTags.photoFilename, photoFilename),
        eq(schema.photoTags.tagId, hiddenTag.id),
      ),
    )
    .limit(1)
    .get();

  return relation !== undefined;
}

/** Affecte un tag à une photo */
export function addTagToPhoto(photoFilename: string, tagId: number): void {
  const database = getDB();
  try {
    database.insert(schema.photoTags).values({ photoFilename, tagId }).run();
  } catch (error) {
    // Ignore les erreurs de contrainte unique (déjà existant)
  }
}

/** Retire un tag d'une photo */
export function removeTagFromPhoto(
  photoFilename: string,
  tagId: number,
): boolean {
  const database = getDB();
  const result = database
    .delete(schema.photoTags)
    .where(
      and(
        eq(schema.photoTags.photoFilename, photoFilename),
        eq(schema.photoTags.tagId, tagId),
      ),
    )
    .run();
  return result.changes > 0;
}

/** Récupère tous les tags d'une photo */
export function getPhotoTags(photoFilename: string): Tag[] {
  const database = getDB();
  return database
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
    })
    .from(schema.tags)
    .innerJoin(schema.photoTags, eq(schema.tags.id, schema.photoTags.tagId))
    .where(eq(schema.photoTags.photoFilename, photoFilename))
    .orderBy(asc(schema.tags.name))
    .all();
}

/** Récupère toutes les photos qui ont TOUS les tags spécifiés (intersection) */
export function getPhotosByAllTags(tagIds: number[]): Photo[] {
  if (tagIds.length === 0) return getAllPhotos();

  const database = getDB();

  // Requête SQL brute car Drizzle n'a pas de helper pour cette requête complexe
  const placeholders = tagIds.map(() => "?").join(",");
  const result = sqlite!
    .prepare(
      `
    SELECT p.* FROM photos p
    WHERE (
      SELECT COUNT(DISTINCT pt.tag_id)
      FROM photo_tags pt
      WHERE pt.photo_filename = p.filename
      AND pt.tag_id IN (${placeholders})
    ) = ?
    ORDER BY p.lexoRank
  `,
    )
    .all(...tagIds, tagIds.length) as Photo[];

  return result;
}

/** Récupère toutes les photos qui ont AU MOINS UN des tags spécifiés (union) */
export function getPhotosByAnyTag(tagIds: number[]): Photo[] {
  if (tagIds.length === 0) return [];

  const database = getDB();

  return database
    .selectDistinct({
      filename: schema.photos.filename,
      width: schema.photos.width,
      height: schema.photos.height,
      lexoRank: schema.photos.lexoRank,
    })
    .from(schema.photos)
    .innerJoin(
      schema.photoTags,
      eq(schema.photos.filename, schema.photoTags.photoFilename),
    )
    .where(inArray(schema.photoTags.tagId, tagIds))
    .orderBy(asc(schema.photos.lexoRank))
    .all();
}
