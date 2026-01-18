import fs from "fs";
import path from "path";
import { deletePhoto } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";

import type { RequestEvent } from "@sveltejs/kit";

export async function DELETE({ params, request }: RequestEvent) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  const filename = params.filename;
  if (!filename) {
    return json({ error: "Filename is required." }, { status: 400 });
  }
  console.log("Deleting photo:", filename);

  const extIndex = filename.lastIndexOf(".");
  const base = extIndex !== -1 ? filename.slice(0, extIndex) : filename;
  const ext = extIndex !== -1 ? filename.slice(extIndex) : "";
  const thumbName = `${base}-minia${ext}`;

  const photoPath = path.join(process.cwd(), "static", "photos", filename);
  const thumbnailPath = path.join(
    process.cwd(),
    "static",
    "photos",
    "minias",
    thumbName,
  );

  try {
    await fs.promises.unlink(photoPath);

    const dbDeleted = deletePhoto(filename);
    if (dbDeleted) {
      console.log(`Photo supprimée de la DB: ${filename}`);
    } else {
      console.warn(`Photo non trouvée dans la DB: ${filename}`);
    }

    try {
      await fs.promises.unlink(thumbnailPath);
      return json({ message: "Photo and thumbnail deleted." });
    } catch (thumbErr) {
      return json({ message: "Photo deleted, thumbnail not found." });
    }
  } catch (err) {
    console.error("Échec suppression photo:", err);
    return json({ error: "Photo not found." }, { status: 404 });
  }
}
