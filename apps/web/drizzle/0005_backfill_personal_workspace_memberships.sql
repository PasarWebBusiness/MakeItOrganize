-- Give legacy users a deterministic personal workspace when they do not have one.
INSERT INTO `workspaces` (`id`, `name`, `type`, `owner_id`, `created_at`, `updated_at`)
SELECT
	'personal-' || `users`.`id`,
	'Workspace ' || `users`.`name`,
	'personal',
	`users`.`id`,
	CAST(strftime('%s', 'now') AS integer) * 1000,
	CAST(strftime('%s', 'now') AS integer) * 1000
FROM `users`
WHERE NOT EXISTS (
	SELECT 1 FROM `workspaces`
	WHERE `workspaces`.`owner_id` = `users`.`id`
		AND `workspaces`.`type` = 'personal'
)
ON CONFLICT (`id`) DO NOTHING;
--> statement-breakpoint
-- Restore only missing owner memberships. Suspended rows are intentionally untouched.
INSERT INTO `memberships` (`workspace_id`, `user_id`, `role`, `status`, `created_at`, `updated_at`)
SELECT
	`workspaces`.`id`,
	`workspaces`.`owner_id`,
	'owner',
	'active',
	CAST(strftime('%s', 'now') AS integer) * 1000,
	CAST(strftime('%s', 'now') AS integer) * 1000
FROM `workspaces`
WHERE `workspaces`.`type` = 'personal'
	AND NOT EXISTS (
		SELECT 1 FROM `memberships`
		WHERE `memberships`.`workspace_id` = `workspaces`.`id`
			AND `memberships`.`user_id` = `workspaces`.`owner_id`
	)
ON CONFLICT (`workspace_id`, `user_id`) DO NOTHING;
