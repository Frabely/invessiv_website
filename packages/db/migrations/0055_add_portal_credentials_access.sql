-- Ordner 19 (Task 71): portal access to customer credentials. The three permissions live in
-- their own system role and deliberately not in portal_standard: a contact only reaches
-- credentials when the role is assigned on purpose. Nobody holds the role after this migration.

-- Mirror of PERMISSION_DEFINITIONS; db:smoke:rbac compares both directions.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('portal.credentials.read', 'portal', TRUE, FALSE, 'See released credentials without their secret values.'),
       ('portal.credentials.reveal', 'portal', TRUE, FALSE, 'Reveal and copy a single released credential secret.'),
       ('portal.credentials.write', 'portal', TRUE, FALSE,
        'Add own credentials and change released ones.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- Widen roles.system_key to allow the portal credentials role.
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_system_key_check;
ALTER TABLE roles
    ADD CONSTRAINT roles_system_key_check CHECK (system_key IN (
                                                                'workspace_owner', 'workspace_member',
                                                                'workspace_credentials_manager', 'portal_standard',
                                                                'portal_credentials'
        ));
--> statement-breakpoint

-- Fixed id mirrors SYSTEM_ROLE_DEFINITIONS.
INSERT INTO roles (id, realm, system_key, name, description, is_system, active, scope_assignable, version)
VALUES ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a05', 'portal', 'portal_credentials', 'Portal credentials', NULL, TRUE,
        TRUE, FALSE, 1) ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- Only the new role receives the permissions. portal_standard and the workspace owner stay unchanged.
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a05', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key IN ('portal.credentials.read', 'portal.credentials.reveal',
                'portal.credentials.write') ON CONFLICT (role_id, permission_key) DO NOTHING;
