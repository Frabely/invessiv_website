-- Task 36: scoped role assignments. Nullable flags keep this expand migration compatible
-- with the previous application version; Task 38 tightens them to NOT NULL.

ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS scope_assignable BOOLEAN;
ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS scope_assignable BOOLEAN;
ALTER TABLE role_permissions
    ADD COLUMN IF NOT EXISTS role_scope_assignable BOOLEAN;
ALTER TABLE role_permissions
    ADD COLUMN IF NOT EXISTS permission_scope_assignable BOOLEAN;
--> statement-breakpoint

UPDATE permissions
SET scope_assignable = key IN (
    'customers.read'
  , 'customers.write'
  , 'projects.read'
  , 'projects.write'
  , 'tasks.write'
  , 'files.read'
  , 'files.write'
  , 'files.delete'
  , 'credentials.read'
  , 'credentials.reveal'
  , 'credentials.write'
  , 'portal.manage'
    )
WHERE scope_assignable IS NULL;
--> statement-breakpoint

UPDATE roles
SET scope_assignable = FALSE
WHERE scope_assignable IS NULL;
--> statement-breakpoint

UPDATE role_permissions AS rp
SET role_scope_assignable       = r.scope_assignable,
    permission_scope_assignable = p.scope_assignable FROM roles AS r, permissions AS p
WHERE rp.role_id = r.id
  AND rp.permission_key = p.key
  AND (rp.role_scope_assignable IS NULL
   OR rp.permission_scope_assignable IS NULL);
--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE permissions
    ADD CONSTRAINT permissions_key_realm_scope_assignable_unique
        UNIQUE (key, realm, scope_assignable);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO
$$
BEGIN
ALTER TABLE roles
    ADD CONSTRAINT roles_id_realm_scope_assignable_unique
        UNIQUE (id, realm, scope_assignable);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE roles
    ADD CONSTRAINT roles_system_scope_assignable_check
        CHECK (NOT (is_system AND scope_assignable));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO
$$
BEGIN
ALTER TABLE role_permissions
    ADD CONSTRAINT role_permissions_scope_assignable_check
        CHECK (NOT role_scope_assignable OR permission_scope_assignable);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE role_permissions
    ADD CONSTRAINT role_permissions_scope_role_foreign_key
        FOREIGN KEY (role_id, realm, role_scope_assignable)
            REFERENCES roles (id, realm, scope_assignable) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO
$$
BEGIN
ALTER TABLE role_permissions
    ADD CONSTRAINT role_permissions_scope_permission_foreign_key
        FOREIGN KEY (permission_key, realm, permission_scope_assignable)
            REFERENCES permissions (key, realm, scope_assignable) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS workspace_member_scoped_roles
(
    id
    UUID
    PRIMARY
    KEY,
    workspace_member_id
    UUID
    NOT
    NULL
    REFERENCES
    workspace_members
(
    id
) ON DELETE RESTRICT,
    role_id UUID NOT NULL,
    role_realm TEXT NOT NULL,
    role_scope_assignable BOOLEAN NOT NULL
    CONSTRAINT workspace_member_scoped_roles_scope_assignable_check CHECK
(
    role_scope_assignable
),
    customer_id UUID NOT NULL REFERENCES customers
(
    id
)
  ON DELETE RESTRICT,
    project_id UUID,
    assigned_by_user_id UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT workspace_member_scoped_roles_realm_check CHECK
(
    role_realm =
    'workspace'
),
    CONSTRAINT workspace_member_scoped_roles_role_foreign_key
    FOREIGN KEY
(
    role_id,
    role_realm,
    role_scope_assignable
)
    REFERENCES roles
(
    id,
    realm,
    scope_assignable
)
  ON DELETE RESTRICT,
    CONSTRAINT workspace_member_scoped_roles_project_customer_foreign_key
    FOREIGN KEY
(
    project_id,
    customer_id
)
    REFERENCES projects
(
    id,
    customer_id
)
  ON DELETE RESTRICT
    );
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS workspace_member_scoped_roles_customer_unique
    ON workspace_member_scoped_roles (workspace_member_id, role_id, customer_id)
    WHERE project_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS workspace_member_scoped_roles_project_unique
    ON workspace_member_scoped_roles (workspace_member_id, role_id, project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS workspace_member_scoped_roles_customer_index
    ON workspace_member_scoped_roles (customer_id);
CREATE INDEX IF NOT EXISTS workspace_member_scoped_roles_project_index
    ON workspace_member_scoped_roles (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS workspace_member_scoped_roles_role_index
    ON workspace_member_scoped_roles (role_id);
--> statement-breakpoint

ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_type_check;
ALTER TABLE security_events
    ADD CONSTRAINT security_events_type_check CHECK (type IN (
                                                              'workspace_owner_bootstrapped', 'workspace_member_added',
                                                              'workspace_member_roles_changed',
                                                              'workspace_owner_granted',
                                                              'workspace_owner_revoked', 'workspace_member_deactivated',
                                                              'workspace_member_activated',
                                                              'workspace_responsibilities_handed_over',
                                                              'role_created', 'role_updated',
                                                              'workspace_member_access_scope_granted',
                                                              'workspace_member_access_scope_revoked'
        ));
