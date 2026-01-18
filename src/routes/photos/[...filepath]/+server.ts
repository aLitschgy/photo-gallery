import { error } from "@sveltejs/kit";
import fs from "fs";
import path from "path";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
  let filepath = event.params.filename;

  if (!filepath) {
    throw error(400, "No filepath provided");
  }

  // If filepath is an array (from a rest parameter), join it
  if (Array.isArray(filepath)) {
    filepath = filepath.join("/");
  }

  // Security: prevent directory traversal
  if (filepath.includes("..")) {
    throw error(400, "Invalid filepath");
  }

  // Try both locations: static/photos and gallery-data/photos
  const locations = [
    path.join(process.cwd(), "static", "photos", filepath),
    path.join(process.cwd(), "gallery-data", "photos", filepath),
  ];

  let buffer: Buffer | null = null;

  for (const loc of locations) {
    try {
      const stat = await fs.promises.stat(loc);
      if (stat.isFile()) {
        buffer = await fs.promises.readFile(loc);
        break;
      }
    } catch (err) {
      // File not found in this location, try next
      continue;
    }
  }

  if (!buffer) {
    console.warn(`Photo not found for filepath: ${filepath}`);
    throw error(404, "Photo not found");
  }

  // Determine MIME type
  let mimeType = "application/octet-stream";
  const ext = path.extname(filepath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  if (ext in mimeTypes) {
    mimeType = mimeTypes[ext];
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
