-- Ordner 20 (Task 73): portal read access to hours. Both permissions are plain read rights and
-- belong to portal_standard, so every existing contact sees the balance and the time entries.

-- Mirror of PERMISSION_DEFINITIONS; db:smoke:rbac compares both directions.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('portal.hours.read', 'portal', TRUE, FALSE, 'See purchased, used and remaining hours per project.'),
       ('portal.hours.entries.read', 'portal', TRUE, FALSE, 'See each time entry with date, duration and description.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key IN ('portal.hours.read', 'portal.hours.entries.read')
ON CONFLICT (role_id, permission_key) DO NOTHING;
