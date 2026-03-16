CREATE TEMP TABLE `_tag_merge_map` (
	`duplicate_id` integer NOT NULL,
	`canonical_id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `_tag_merge_map` (`duplicate_id`, `canonical_id`)
WITH `canonical_tags` AS (
	SELECT lower(trim(`name`)) AS `normalized_name`, min(`id`) AS `canonical_id`
	FROM `tags`
	GROUP BY lower(trim(`name`))
)
SELECT t.`id`, c.`canonical_id`
FROM `tags` t
INNER JOIN `canonical_tags` c
	ON lower(trim(t.`name`)) = c.`normalized_name`
WHERE t.`id` <> c.`canonical_id`;
--> statement-breakpoint
INSERT OR IGNORE INTO `photo_tags` (`photo_filename`, `tag_id`)
SELECT pt.`photo_filename`, m.`canonical_id`
FROM `photo_tags` pt
INNER JOIN `_tag_merge_map` m ON pt.`tag_id` = m.`duplicate_id`;
--> statement-breakpoint
DELETE FROM `photo_tags`
WHERE `tag_id` IN (SELECT `duplicate_id` FROM `_tag_merge_map`);
--> statement-breakpoint
DELETE FROM `tags`
WHERE `id` IN (SELECT `duplicate_id` FROM `_tag_merge_map`);
--> statement-breakpoint
UPDATE `tags`
SET `name` = lower(trim(`name`));
--> statement-breakpoint
DROP TABLE `_tag_merge_map`;