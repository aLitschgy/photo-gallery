import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath =
  process.env.DB_PATH || join(__dirname, "gallery-data", "data", "photos.db");

console.log("Running migrations...");
console.log("Database path:", dbPath);

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: join(__dirname, "drizzle") });

console.log("Migrations completed successfully!");
sqlite.close();
