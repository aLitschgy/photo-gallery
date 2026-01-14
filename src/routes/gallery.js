// gallery.js
import fs from "fs";
import { getAllPhotos } from "../db/db.js";

export async function galleryHandler(req, res) {
  // Récupère la liste des photos depuis la base de données JSON
  const photosDB = getAllPhotos();

  // Vérifie que chaque photo de la DB existe réellement
  const images = photosDB
    .map((photo) => {
      const f = photo.filename;
      const path = `public/photos/${f}`;

      if (!fs.existsSync(path)) {
        console.warn(`Fichier référencé dans la DB mais absent: ${f}`);
        return null;
      }

      // Utilise les dimensions stockées dans la DB
      return {
        src: `/photos/${f}`,
        thumb: `/photos/minias/${f.replace(/(\.[^.]*)$/, "-minia$1")}`,
        width: photo.width,
        height: photo.height,
        lexoRank: photo.lexoRank,
      };
    })
    .filter((p) => p !== null);

  res.json(images);
}
