#!/usr/bin/env node
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "gallery-data/data/photos.db");

const db = new Database(DB_PATH);

console.log("📊 Contenu de la base de données réelle:\n");

console.log("Photos:");
const photos = db.prepare("SELECT * FROM photos").all();
console.log(photos.length > 0 ? photos : "  (aucune photo)");

console.log("\nTags:");
const tags = db.prepare("SELECT * FROM tags").all();
console.log(tags.length > 0 ? tags : "  (aucun tag)");

console.log("\nRelations photo-tags:");
const photoTags = db.prepare("SELECT * FROM photo_tags").all();
console.log(photoTags.length > 0 ? photoTags : "  (aucune relation)");

db.close();
