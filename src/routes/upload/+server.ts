import sharp from "sharp";
import fs from "fs";
import path from "path";
import { addPhoto } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

async function pickAvailableName(base: string, ext: string, dir: string) {
  let candidate = `${base}${ext}`;
  let counter = 1;

  while (true) {
    const target = path.join(dir, candidate);
    try {
      await fs.promises.access(target);
      candidate = `${base}-${counter}${ext}`;
      counter += 1;
    } catch {
      return candidate;
    }
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const fileEntries = formData.getAll("photo");
    const files = fileEntries.filter(
      (entry): entry is File => entry instanceof File,
    );

    if (!files || files.length === 0) {
      return json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const promises = files.map(async (file) => {
      const originalName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      const uploadsDir = path.join(process.cwd(), "uploads");
      const photosDir = path.join(process.cwd(), "static", "photos");
      const thumbsDir = path.join(photosDir, "minias");

      // Ensure folders exist before any access/copy
      await fs.promises.mkdir(uploadsDir, { recursive: true });
      await fs.promises.mkdir(photosDir, { recursive: true });
      await fs.promises.mkdir(thumbsDir, { recursive: true });

      // Pick a non-colliding filename
      const ext = path.extname(originalName);
      const base = path.basename(originalName, ext);
      const uniqueName = await pickAvailableName(base, ext, photosDir);

      const tempPath = path.join(uploadsDir, `${Date.now()}-${uniqueName}`);
      const newPath = path.join(photosDir, uniqueName);

      // Save temp file then move to destination
      await fs.promises.writeFile(tempPath, buffer);
      await fs.promises.copyFile(tempPath, newPath);
      await fs.promises.unlink(tempPath);

      // Generate thumbnail
      const thumbName = `${path.basename(uniqueName, ext)}-minia${ext}`;
      const thumbPath = path.join(thumbsDir, thumbName);
      await sharp(newPath).rotate().resize({ height: 1000 }).toFile(thumbPath);

      // Get metadata
      const metadata = await sharp(newPath).metadata();
      let width = metadata.width;
      let height = metadata.height;

      if (metadata.orientation && [5, 6, 7, 8].includes(metadata.orientation)) {
        [width, height] = [height, width];
      }

      // Add to database
      addPhoto(uniqueName, width, height);
      console.log(`Photo ajoutée à la DB: ${uniqueName} (${width}x${height})`);
    });

    await Promise.all(promises);

    return json({ success: true, message: "Photos uploadées avec succès" });
  } catch (err) {
    console.error("Erreur lors du traitement des uploads:", err);
    return json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
};
