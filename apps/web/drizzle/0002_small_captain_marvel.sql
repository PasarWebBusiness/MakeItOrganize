CREATE TABLE `external_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`email` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_identity_provider_subject_unique` ON `external_identities` (`provider`,`provider_subject`);--> statement-breakpoint
CREATE INDEX `external_identity_user_idx` ON `external_identities` (`user_id`);--> statement-breakpoint
CREATE TABLE `integration_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`account_email` text,
	`status` text DEFAULT 'active' NOT NULL,
	`granted_scopes` text DEFAULT '[]' NOT NULL,
	`access_token_ciphertext` text NOT NULL,
	`refresh_token_ciphertext` text,
	`token_expires_at` integer,
	`sync_cursor` text,
	`last_synced_at` integer,
	`last_error_code` text,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integration_provider_account_unique` ON `integration_connections` (`user_id`,`provider`,`provider_account_id`);--> statement-breakpoint
CREATE INDEX `integration_workspace_status_idx` ON `integration_connections` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `integration_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`connection_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`dedupe_key` text NOT NULL,
	`payload` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` integer NOT NULL,
	`locked_at` integer,
	`last_error_code` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`connection_id`) REFERENCES `integration_connections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integration_job_dedupe_unique` ON `integration_jobs` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `integration_job_queue_idx` ON `integration_jobs` (`status`,`available_at`);--> statement-breakpoint
CREATE TABLE `notification_receipts` (
	`user_id` text NOT NULL,
	`notification_id` text NOT NULL,
	`read_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `notification_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_receipt_user_idx` ON `notification_receipts` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `oauth_states` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`provider` text NOT NULL,
	`state_hash` text NOT NULL,
	`code_verifier_ciphertext` text NOT NULL,
	`return_to` text DEFAULT '/' NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_state_hash_unique` ON `oauth_states` (`state_hash`);--> statement-breakpoint
CREATE INDEX `oauth_state_expiry_idx` ON `oauth_states` (`expires_at`);--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`topic` text NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`payload` text NOT NULL,
	`correlation_id` text NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `outbox_unpublished_idx` ON `outbox_events` (`published_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`browser_notifications` integer DEFAULT false NOT NULL,
	`email_notifications` integer DEFAULT false NOT NULL,
	`weekly_summary` integer DEFAULT false NOT NULL,
	`read_notification_ids` text DEFAULT '[]' NOT NULL,
	`ai_read` integer DEFAULT true NOT NULL,
	`ai_move` integer DEFAULT true NOT NULL,
	`ai_create` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `workspace_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
