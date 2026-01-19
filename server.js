import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { handler } from "./build/handler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createApp() {
  const app = express();

  // Serve photos from gallery-data/photos directory
  const photosPath = path.join(process.cwd(), "gallery-data", "photos");
  app.use(
    "/photos",
    express.static(photosPath, {
      maxAge: 0,
      etag: false,
      dotfiles: "deny",
    }),
  );

  app.use(handler);

  return app;
}

const server = await createApp();
const port = process.env.PORT || 3000;

createServer(server).listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📸 Photos served from /gallery-data/photos`);
});
