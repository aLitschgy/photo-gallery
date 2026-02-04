import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";

export const photos = sqliteTable(
  "photos",
  {
    filename: text("filename").primaryKey(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    lexoRank: text("lexoRank").notNull(),
  },
  (table) => ({
    lexoRankIdx: index("idx_lexorank").on(table.lexoRank),
  }),
);

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const photoTags = sqliteTable(
  "photo_tags",
  {
    photoFilename: text("photo_filename")
      .notNull()
      .references(() => photos.filename, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.photoFilename, table.tagId] }),
    tagIdx: index("idx_photo_tags_tag").on(table.tagId),
  }),
);
