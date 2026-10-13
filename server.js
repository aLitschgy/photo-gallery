import express from "express";
import morgan from "morgan";
import path from "path";
import { createServer } from "http";

process.on("uncaughtException", (err) => {
  console.error("💥 uncaughtException:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 unhandledRejection:", reason);
});

// Let adapter-node reconstruct event.url from standard forwarded headers.
if (!process.env.PROTOCOL_HEADER) {
  process.env.PROTOCOL_HEADER = "x-forwarded-proto";
}
if (!process.env.HOST_HEADER) {
  process.env.HOST_HEADER = "x-forwarded-host";
}

const trustProxy = Number(process.env.TRUST_PROXY ?? "0");
if (!Number.isInteger(trustProxy) || trustProxy < 0) {
  throw new Error("TRUST_PROXY must be a non-negative integer");
}

const { handler } = await import("./build/handler.js");

async function createApp() {
  const app = express();
  app.set("trust proxy", trustProxy);

  morgan.token("colored-status", (_req, res) => {
    const status = res.statusCode;
    const color =
      status >= 500
        ? "\x1b[31m"
        : status >= 400
          ? "\x1b[33m"
          : status >= 300
            ? "\x1b[36m"
            : status >= 200
              ? "\x1b[32m"
              : "\x1b[34m";

    return `${color}${status}\x1b[0m`;
  });

  app.use(morgan(":remote-addr :url :colored-status"));

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
