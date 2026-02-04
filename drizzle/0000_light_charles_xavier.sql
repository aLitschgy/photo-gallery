CREATE TABLE `photo_tags` (
	`photo_filename` text NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`photo_filename`, `tag_id`),
	FOREIGN KEY (`photo_filename`) REFERENCES `photos`(`filename`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_photo_tags_tag` ON `photo_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`filename` text PRIMARY KEY NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`lexoRank` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_lexorank` ON `photos` (`lexoRank`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);