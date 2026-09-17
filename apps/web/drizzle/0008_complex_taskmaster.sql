ALTER TABLE `tasks` ADD `external_provider` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `external_id` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `external_container` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `etag` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `sync_status` text DEFAULT 'local' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_workspace_external_unique` ON `tasks` (`workspace_id`,`external_provider`,`external_id`);