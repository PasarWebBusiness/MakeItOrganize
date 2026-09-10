CREATE TABLE `oauth_login_states` (
	`id` text PRIMARY KEY NOT NULL,
	`state_hash` text NOT NULL,
	`code_verifier_ciphertext` text NOT NULL,
	`nonce_ciphertext` text NOT NULL,
	`return_to` text DEFAULT '/' NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_login_state_hash_unique` ON `oauth_login_states` (`state_hash`);--> statement-breakpoint
CREATE INDEX `oauth_login_state_expiry_idx` ON `oauth_login_states` (`expires_at`);--> statement-breakpoint
ALTER TABLE `oauth_states` ADD `nonce_ciphertext` text DEFAULT '' NOT NULL;
