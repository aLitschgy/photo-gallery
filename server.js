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

  app.use(morgan((tokens, req, res) => {
    const status = res.statusCode;
    const remoteAddr = tokens["remote-addr"](req, res);
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const responseTime = tokens["response-time"](req, res);
    const escape = String.fromCharCode(27);
    const colorCode =
      status >= 500 ? 31
        : status >= 400 ? 33
          : status >= 300 ? 36
            : status >= 200 ? 32
              : 34;

    return `${remoteAddr} => `
      + `${escape}[${colorCode}m${method} ${status} ${responseTime}ms${escape}[0m`
      + ` ${url}`;
  }));

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
