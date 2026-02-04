import { defineConfig } from "drizzle-kit";
import path from "path";

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.cwd(), "gallery-data/data/photos.db");

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: DB_PATH,
  },
});
