import type { PageServerLoad } from "./$types";
import fs from "fs";
import path from "path";
import {
  getAllPhotos,
  getAllTags,
  getTagByName,
  getPhotosByAllTags,
  getPhotosByAnyTag,
} from "$lib/server/db/db";

export const load: PageServerLoad = async ({ params }) => {
  const tagsParam = params.tags;

  let photosDB;
  let filterDescription: string | null = null;

  // Pas de filtre, retourne toutes les photos
  if (!tagsParam) {
    photosDB = getAllPhotos();
  } else {
    // Parse les tags depuis l'URL
    let mode: "and" | "or" = "and";
    let tagNames: string[];

    if (tagsParam.includes("+")) {
      // Mode ET (intersection)
      mode = "and";
      tagNames = tagsParam
        .split("+")
        .map((t: string) => decodeURIComponent(t.trim()));
    } else if (tagsParam.includes("-")) {
      // Mode OU (union)
      mode = "or";
      tagNames = tagsParam
        .split("-")
        .map((t: string) => decodeURIComponent(t.trim()));
    } else {
      // Un seul tag
      mode = "and";
      tagNames = [decodeURIComponent(tagsParam)];
    }

    // Récupère les IDs des tags depuis la DB
    const tagIds: number[] = [];
    const validTagNames: string[] = [];

    for (const name of tagNames) {
      const tag = getTagByName(name);
      if (tag) {
        tagIds.push(tag.id);
        validTagNames.push(tag.name);
      }
    }

    // Si aucun tag valide, retourne toutes les photos
    if (tagIds.length === 0) {
      photosDB = getAllPhotos();
      filterDescription = `Aucun tag trouvé pour "${tagNames.join(", ")}"`;
    } else {
      // Applique le filtre selon le mode
      if (mode === "or") {
        photosDB = getPhotosByAnyTag(tagIds);
      } else {
        photosDB = getPhotosByAllTags(tagIds);
      }
    }
  }

  // Convertit les photos en format pour la galerie
  const images = photosDB
    .map((photo) => {
      const f = photo.filename;
      // Check in both possible locations
      const staticPath = path.join(process.cwd(), "static", "photos", f);
      const galleryPath = path.join(process.cwd(), "gallery-data", "photos", f);

      const fileExists =
        fs.existsSync(staticPath) || fs.existsSync(galleryPath);

      if (!fileExists) {
        console.warn(`Fichier référencé dans la DB mais absent: ${f}`);
        return null;
      }

      return {
        src: `/photos/${f}`,
        thumb: `/photos/minias/${f.replace(/(\.[^.]*)$/, "-minia$1")}`,
        width: photo.width,
        height: photo.height,
        lexoRank: photo.lexoRank,
        tags: photo.tags || [],
      };
    })
    .filter((p) => p !== null);

  return {
    images,
    filterDescription,
  };
};
