import express from "express";
import morgan from "morgan";
import path from "path";
import rateLimit from "express-rate-limit";
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

// Chemins/patterns typiques des bots qui scannent WordPress, PHP, etc.
const BAD_PATTERNS = [
  /wp-admin/i,
  /wp-content/i,
  /wp-includes/i,
  /\.php$/i,
  /xmlrpc\.php/i,
  /\.env$/i,
  /\.git/i,
  /phpmyadmin/i,
  /\/\.well-known\/index\.php/i,
];

function badBotFilter(req, res, next) {
  if (BAD_PATTERNS.some((re) => re.test(req.originalUrl))) {
    return res.status(403).end();
  }
  next();
}

// Limite générale de débit par IP (protège aussi les vraies routes contre le flood)
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // 200 requêtes / IP / fenêtre
  standardHeaders: true,
  legacyHeaders: false,
});

async function createApp() {
  const app = express();

  // Indispensable derrière Traefik pour que req.ip soit la vraie IP du client
  // (et non celle de Traefik), et pour que express-rate-limit fonctionne correctement.
  app.set("trust proxy", true);

  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

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

  // Coupe court aux scans connus avant tout traitement (SvelteKit, static, etc.)
  app.use(badBotFilter);

  // Limite le débit général par IP
  app.use(limiter);

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
