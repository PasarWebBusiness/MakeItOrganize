DROP INDEX `events_external_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `events_workspace_external_unique` ON `calendar_events` (`workspace_id`,`external_provider`,`external_id`);