CREATE TABLE `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`reset_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
