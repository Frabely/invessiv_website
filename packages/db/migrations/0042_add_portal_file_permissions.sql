-- Portal files. Custom portal roles deliberately receive no new permissions.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('portal.files.read', 'portal', TRUE, FALSE, 'See, preview and download released files and links.'),
       ('portal.files.write', 'portal', TRUE, FALSE,
        'Upload own files and add own links.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key IN ('portal.files.read', 'portal.files.write') ON CONFLICT (role_id, permission_key) DO NOTHING;
