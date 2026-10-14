-- The owner confirmed that all historical human activities were performed by them.
-- Resolve the workspace owner to users.id, never to a member id or a Clerk provider id.
-- Preserve actor_id and actor_label as historical evidence; valid modern actors stay untouched.
UPDATE activities
SET actor_user_id = (
    SELECT m.user_id
    FROM workspace_members m
    JOIN users u ON u.id = m.user_id
    JOIN workspace_member_roles mr ON mr.workspace_member_id = m.id
    JOIN roles r ON r.id = mr.role_id AND r.realm = mr.role_realm
    WHERE m.active AND u.active AND r.active AND r.is_system
      AND r.realm = 'workspace' AND r.system_key = 'workspace_owner'
), system_actor_key = NULL
WHERE actor_type = 'user' AND actor_user_id IS NULL;
--> statement-breakpoint
-- Legacy system events keep their original actor type; their precise origin is unknown.
UPDATE activities
SET system_actor_key = 'legacy', actor_user_id = NULL
WHERE actor_type = 'system' AND (system_actor_key IS NULL OR btrim(system_actor_key) = '');
--> statement-breakpoint
ALTER TABLE activities VALIDATE CONSTRAINT activities_actor_check;
