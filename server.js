import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";

// Let adapter-node reconstruct event.url from standard forwarded headers.
if (!process.env.PROTOCOL_HEADER) {
  process.env.PROTOCOL_HEADER = "x-forwarded-proto";
}
if (!process.env.HOST_HEADER) {
  process.env.HOST_HEADER = "x-forwarded-host";
}

const { handler } = await import("./build/handler.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createApp() {
  const app = express();

  // In direct HTTP mode (no reverse proxy), synthesize forwarded headers so
  // SvelteKit computes the same origin as the browser for CSRF checks.
  app.use((req, _res, next) => {
    if (!req.headers["x-forwarded-proto"]) {
      req.headers["x-forwarded-proto"] = req.protocol;
    }

    if (!req.headers["x-forwarded-host"] && req.headers.host) {
      req.headers["x-forwarded-host"] = req.headers.host;
    }

    next();
  });

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
