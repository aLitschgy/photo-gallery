import fs from "fs";
import path from "path";
import { getAllPhotos } from "$lib/server/db/db";
import { json } from "@sveltejs/kit";

export async function GET() {
  const photosDB = getAllPhotos();

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
      };
    })
    .filter((p) => p !== null);

  return json(images);
}
