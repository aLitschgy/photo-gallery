// db.js - Gestion de la base de données JSON pour les photos
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateLexoRank, compareLexoRank } from "../utils/lexorank.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "photos.json");

/**
 * Lit la base de données JSON
 * @returns {Array} Liste des photos
 */
export function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erreur lecture DB:", err);
    return [];
  }
}

/**
 * Écrit dans la base de données JSON
 * @param {Array} data - Liste des photos
 */
export function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture DB:", err);
    throw err;
  }
}

/**
 * Ajoute une photo à la base de données
 * @param {string} filename - Nom du fichier
 * @param {number} width - Largeur de l'image
 * @param {number} height - Hauteur de l'image
 * @param {string} lexoRank - Index LexoRank (optionnel, généré automatiquement si absent)
 * @returns {Object} La photo ajoutée
 */
export function addPhoto(filename, width, height, lexoRank = null) {
  const photos = readDB();

  let rank;
  if (lexoRank) {
    rank = lexoRank;
  } else {
    // Génère un LexoRank pour ajouter à la fin
    const sortedPhotos = photos.sort((a, b) =>
      compareLexoRank(a.lexoRank, b.lexoRank)
    );
    const lastRank =
      sortedPhotos.length > 0
        ? sortedPhotos[sortedPhotos.length - 1].lexoRank
        : null;
    rank = generateLexoRank(lastRank, null);
  }

  const newPhoto = {
    filename,
    width,
    height,
    lexoRank: rank,
  };

  photos.push(newPhoto);
  writeDB(photos);

  return newPhoto;
}

/**
 * Supprime une photo de la base de données
 * @param {string} filename - Nom du fichier à supprimer
 * @returns {boolean} true si supprimé, false sinon
 */
export function deletePhoto(filename) {
  const photos = readDB();
  const initialLength = photos.length;
  const filtered = photos.filter((p) => p.filename !== filename);

  if (filtered.length < initialLength) {
    writeDB(filtered);
    return true;
  }

  return false;
}

/**
 * Récupère toutes les photos de la DB (triées par LexoRank)
 * @returns {Array} Liste des photos
 */
export function getAllPhotos() {
  const photos = readDB();
  return photos.sort((a, b) => compareLexoRank(a.lexoRank, b.lexoRank));
}

/**
 * Vérifie si une photo existe dans la DB
 * @param {string} filename - Nom du fichier
 * @returns {boolean} true si existe, false sinon
 */
export function photoExists(filename) {
  const photos = readDB();
  return photos.some((p) => p.filename === filename);
}

/**
 * Déplace une photo dans l'ordre
 * @param {string} filename - Nom du fichier à déplacer
 * @param {string|null} prevFilename - Nom du fichier précédent (null si début)
 * @param {string|null} nextFilename - Nom du fichier suivant (null si fin)
 * @returns {Object} La photo mise à jour
 */
export function reorderPhoto(filename, prevFilename, nextFilename) {
  const photos = readDB();
  const photoIndex = photos.findIndex((p) => p.filename === filename);

  if (photoIndex === -1) {
    throw new Error(`Photo ${filename} non trouvée`);
  }

  // Trouve les ranks précédent et suivant
  const prevRank = prevFilename
    ? photos.find((p) => p.filename === prevFilename)?.lexoRank
    : null;
  const nextRank = nextFilename
    ? photos.find((p) => p.filename === nextFilename)?.lexoRank
    : null;

  // Génère le nouveau rank
  const newRank = generateLexoRank(prevRank, nextRank);

  // Met à jour le rank de la photo
  photos[photoIndex].lexoRank = newRank;
  writeDB(photos);

  return photos[photoIndex];
}
