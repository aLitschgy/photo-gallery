// reorder.js - Endpoint pour réordonner les photos
import { reorderPhoto } from "../db/db.js";

/**
 * Handler pour réordonner une photo
 * Body attendu:
 * {
 *   filename: "photo.jpg",
 *   prevFilename: "photo-avant.jpg" | null,
 *   nextFilename: "photo-apres.jpg" | null
 * }
 */
export function reorderHandler(req, res) {
  try {
    const { filename, prevFilename, nextFilename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: "filename est requis" });
    }

    const updatedPhoto = reorderPhoto(
      filename,
      prevFilename || null,
      nextFilename || null
    );

    console.log(
      `Photo réordonnée: ${filename} -> LexoRank: ${updatedPhoto.lexoRank}`
    );

    res.json({
      success: true,
      photo: updatedPhoto,
    });
  } catch (err) {
    console.error("Erreur réordonnancement:", err);
    res.status(500).json({ error: err.message });
  }
}
