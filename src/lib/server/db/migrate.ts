import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.cwd(), "gallery-data/data/photos.db");

console.log("🔄 Application des migrations...");
console.log("📂 Base de données:", DB_PATH);

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite);

try {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("✅ Migrations appliquées avec succès");
} catch (error) {
  console.error("❌ Erreur lors de l'application des migrations:", error);
  process.exit(1);
} finally {
  sqlite.close();
}
