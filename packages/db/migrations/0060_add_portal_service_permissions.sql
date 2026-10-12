-- Ordner 13c (Task 76): portal access to service requests. Reading the catalog and the own requests
-- and sending a request both belong to portal_standard, so every existing contact can ask for a
-- service. The owner view only ever gets the read permission (PORTAL_READ_PERMISSION_VALUES).

-- Mirror of PERMISSION_DEFINITIONS; db:smoke:rbac compares both directions.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('portal.services.read', 'portal', TRUE, FALSE, 'See requestable services and the company''s own requests.'),
       ('portal.services.request', 'portal', TRUE, FALSE, 'Request a service and withdraw an open request.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key IN ('portal.services.read', 'portal.services.request')
ON CONFLICT (role_id, permission_key) DO NOTHING;
