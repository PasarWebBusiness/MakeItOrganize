ALTER TABLE `resources` ADD `external_provider` text;--> statement-breakpoint
ALTER TABLE `resources` ADD `external_id` text;--> statement-breakpoint
ALTER TABLE `resources` ADD `external_url` text;--> statement-breakpoint
CREATE UNIQUE INDEX `resources_workspace_external_unique` ON `resources` (`workspace_id`,`external_provider`,`external_id`);