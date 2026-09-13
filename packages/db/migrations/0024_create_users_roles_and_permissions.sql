-- Unit 03: persisted users, permission catalog, roles and security events.
-- The legacy identity columns on workspace_members are dropped directly: the table is empty and no
-- deployed app version reads it. The preflight aborts before any change if unit-01 tables hold data.

DO
$$
BEGIN
    IF
EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'workspace_members'
          AND column_name = 'clerk_user_id'
    ) AND (
        EXISTS (SELECT 1 FROM workspace_members)
        OR EXISTS (SELECT 1 FROM customers)
        OR EXISTS (SELECT 1 FROM people)
        OR EXISTS (SELECT 1 FROM customer_contact_assignments)
    ) THEN
        RAISE EXCEPTION 'Migration 0024 aborted: unit-01 CRM tables are not empty. Remove fixture rows or write a data migration plan first.';
END IF;
END
$$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS users
(
    id
    UUID
    PRIMARY
    KEY,
    clerk_user_id
    TEXT
    NOT
    NULL
    CONSTRAINT
    users_clerk_user_id_check
    CHECK (
    BTRIM
(
    clerk_user_id
) <> ''),
    primary_email TEXT NOT NULL CONSTRAINT users_primary_email_check CHECK
(
    BTRIM
(
    primary_email
) <> ''),
    first_name TEXT,
    last_name TEXT,
    display_name TEXT NOT NULL CONSTRAINT users_display_name_check CHECK
(
    BTRIM
(
    display_name
) <> ''),
    active BOOLEAN NOT NULL,
    version INTEGER NOT NULL CONSTRAINT users_version_check CHECK
(
    version >
    0
),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_user_id_uidx
    ON users (clerk_user_id);
--> statement-breakpoint

DROP INDEX IF EXISTS workspace_members_clerk_user_id_uidx;
--> statement-breakpoint
DROP INDEX IF EXISTS workspace_members_email_lower_uidx;
--> statement-breakpoint
DROP INDEX IF EXISTS workspace_members_active_role_idx;
--> statement-breakpoint
ALTER TABLE workspace_members
DROP
COLUMN IF EXISTS clerk_user_id,
    DROP
COLUMN IF EXISTS email,
    DROP
COLUMN IF EXISTS role,
    DROP
COLUMN IF EXISTS credentials_access;
--> statement-breakpoint
ALTER TABLE workspace_members
    ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_user_id_uidx
    ON workspace_members (user_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS permissions
(
    key
    TEXT
    PRIMARY
    KEY,
    realm
    TEXT
    NOT
    NULL
    CONSTRAINT
    permissions_realm_check
    CHECK (
    realm
    IN
(
    'workspace',
    'portal'
)),
    delegable BOOLEAN NOT NULL,
    description TEXT NOT NULL CONSTRAINT permissions_description_check CHECK
(
    BTRIM
(
    description
) <> '')
    );
--> statement-breakpoint
-- Target of the composite foreign key that copies realm and delegability into role_permissions.
CREATE UNIQUE INDEX IF NOT EXISTS permissions_key_realm_delegable_uidx
    ON permissions (key, realm, delegable);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS roles
(
    id
    UUID
    PRIMARY
    KEY,
    realm
    TEXT
    NOT
    NULL
    CONSTRAINT
    roles_realm_check
    CHECK (
    realm
    IN
(
    'workspace',
    'portal'
)),
    system_key TEXT CONSTRAINT roles_system_key_check CHECK
(
    system_key
    IN
(
    'workspace_owner',
    'workspace_member',
    'workspace_credentials_manager'
)
    ),
    name TEXT NOT NULL CONSTRAINT roles_name_check CHECK
(
    BTRIM
(
    name
) <> ''),
    description TEXT,
    is_system BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    version INTEGER NOT NULL CONSTRAINT roles_version_check CHECK
(
    version >
    0
),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT roles_system_key_consistency_check CHECK
(
    is_system =
(
    system_key
    IS
    NOT
    NULL
))
    );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS roles_system_key_uidx
    ON roles (system_key);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS roles_realm_name_uidx
    ON roles (realm, LOWER (BTRIM(name)));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS roles_id_realm_uidx
    ON roles (id, realm);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS roles_id_realm_is_system_uidx
    ON roles (id, realm, is_system);
--> statement-breakpoint

-- realm is shared by both composite keys: a role only holds permissions of its own realm.
-- The copied flags let a plain CHECK keep non-delegable permissions out of custom roles.
CREATE TABLE IF NOT EXISTS role_permissions
(
    role_id
    UUID
    NOT
    NULL,
    realm
    TEXT
    NOT
    NULL
    CONSTRAINT
    role_permissions_realm_check
    CHECK (
    realm
    IN
(
    'workspace',
    'portal'
)),
    role_is_system BOOLEAN NOT NULL,
    permission_key TEXT NOT NULL,
    permission_delegable BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT role_permissions_pkey PRIMARY KEY
(
    role_id,
    permission_key
),
    CONSTRAINT role_permissions_role_fkey FOREIGN KEY
(
    role_id,
    realm,
    role_is_system
)
    REFERENCES roles
(
    id,
    realm,
    is_system
) ON DELETE CASCADE,
    CONSTRAINT role_permissions_permission_fkey FOREIGN KEY
(
    permission_key,
    realm,
    permission_delegable
)
    REFERENCES permissions
(
    key,
    realm,
    delegable
)
  ON UPDATE CASCADE,
    CONSTRAINT role_permissions_delegation_check CHECK
(
    role_is_system
    OR
    permission_delegable
)
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS role_permissions_permission_key_idx
    ON role_permissions (permission_key);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS workspace_member_roles
(
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
    role_realm TEXT NOT NULL CONSTRAINT workspace_member_roles_role_realm_check CHECK
(
    role_realm
    IN
(
    'workspace'
)),
    assigned_by_user_id UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT workspace_member_roles_pkey PRIMARY KEY
(
    workspace_member_id,
    role_id
),
    CONSTRAINT workspace_member_roles_role_fkey FOREIGN KEY
(
    role_id,
    role_realm
)
    REFERENCES roles
(
    id,
    realm
)
  ON DELETE RESTRICT
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS workspace_member_roles_role_id_idx
    ON workspace_member_roles (role_id);
--> statement-breakpoint

-- Append-only. subject_id has no foreign key so the log survives purges of its subject.
CREATE TABLE IF NOT EXISTS security_events
(
    id
    UUID
    PRIMARY
    KEY,
    type
    TEXT
    NOT
    NULL
    CONSTRAINT
    security_events_type_check
    CHECK (
    type
    IN
(
    'workspace_owner_bootstrapped'
)),
    actor_type TEXT NOT NULL CONSTRAINT security_events_actor_type_check CHECK
(
    actor_type
    IN
(
    'system',
    'user',
    'customer'
)),
    actor_user_id UUID REFERENCES users
(
    id
) ON DELETE RESTRICT,
    system_actor_key TEXT,
    subject_type TEXT NOT NULL CONSTRAINT security_events_subject_type_check CHECK
(
    subject_type
    IN
(
    'workspace_member'
)),
    subject_id UUID NOT NULL,
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT security_events_actor_check CHECK
(
    (
    actor_type
    IN
(
    'user',
    'customer'
) AND actor_user_id IS NOT NULL AND system_actor_key IS NULL)
    OR
(
    actor_type
    IN
(
    'system'
) AND system_actor_key IS NOT NULL AND BTRIM
(
    system_actor_key
) <> '' AND actor_user_id IS NULL)
    )
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS security_events_subject_occurred_at_idx
    ON security_events (subject_type, subject_id, occurred_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS security_events_occurred_at_idx
    ON security_events (occurred_at DESC);
--> statement-breakpoint

-- Security events are immutable by default. Migrations and fixture cleanup must opt in for one
-- transaction through set_config('invessiv.security_event_maintenance', 'on', true).
CREATE
OR REPLACE FUNCTION reject_security_event_mutation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF
CURRENT_SETTING('invessiv.security_event_maintenance', TRUE) IS DISTINCT FROM 'on' THEN
        RAISE EXCEPTION 'security_events is append-only';
END IF;

    IF
TG_OP = 'DELETE' THEN
        RETURN OLD;
END IF;
RETURN NEW;
END
$$;
--> statement-breakpoint
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'security_events_append_only_trigger'
          AND tgrelid = 'security_events'::regclass
    ) THEN
CREATE TRIGGER security_events_append_only_trigger
    BEFORE UPDATE OR
DELETE
ON security_events
            FOR EACH ROW
        EXECUTE FUNCTION reject_security_event_mutation();
END IF;
END
$$;
--> statement-breakpoint

-- Mirror of PERMISSION_DEFINITIONS; db:smoke and db:smoke:rbac compare both directions.
INSERT INTO permissions (key, realm, delegable, description)
VALUES ('dashboard.read', 'workspace', TRUE, 'View the workspace dashboard.'),
       ('leads.read', 'workspace', TRUE, 'View leads and their history.'),
       ('leads.write', 'workspace', TRUE, 'Create, edit and archive leads.'),
       ('leads.delete', 'workspace', TRUE, 'Permanently delete leads.'),
       ('leads.import', 'workspace', TRUE, 'Import leads from CSV files.'),
       ('outreach.generate', 'workspace', TRUE, 'Generate outreach message drafts.'),
       ('members.read', 'workspace', TRUE, 'List workspace members, e.g. to pick an owner.'),
       ('customers.read', 'workspace', TRUE, 'View customers and contacts.'),
       ('customers.write', 'workspace', TRUE, 'Create, edit, archive and reassign customers.'),
       ('projects.read', 'workspace', TRUE, 'View projects and tasks.'),
       ('projects.write', 'workspace', TRUE, 'Create, edit and reassign projects.'),
       ('tasks.write', 'workspace', TRUE, 'Create, edit and reassign tasks.'),
       ('files.read', 'workspace', TRUE, 'View and download customer files.'),
       ('files.write', 'workspace', TRUE, 'Upload files and change their portal visibility.'),
       ('files.delete', 'workspace', TRUE, 'Delete customer files.'),
       ('credentials.read', 'workspace', TRUE, 'View credential metadata without secret values.'),
       ('credentials.reveal', 'workspace', TRUE, 'Reveal and copy a single credential secret.'),
       ('credentials.write', 'workspace', TRUE, 'Create, change and delete credentials.'),
       ('portal.manage', 'workspace', TRUE, 'Invite and revoke customer portal access.'),
       ('roles.manage', 'workspace', FALSE, 'Create and change roles.'),
       ('members.manage', 'workspace', FALSE, 'Add, deactivate and assign roles to members.'),
       ('data.export', 'workspace', FALSE, 'Export customer data.'),
       ('data.purge', 'workspace', FALSE, 'Irreversibly purge a customer.'),
       ('security.audit', 'workspace', FALSE, 'Read the security event log.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- Fixed ids mirror SYSTEM_ROLE_DEFINITIONS.
INSERT INTO roles (id, realm, system_key, name, description, is_system, active, version)
VALUES ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01', 'workspace', 'workspace_owner', 'Workspace owner', NULL, TRUE, TRUE, 1),
       ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02', 'workspace', 'workspace_member', 'Workspace member', NULL, TRUE, TRUE,
        1),
       ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a03', 'workspace', 'workspace_credentials_manager',
        'Workspace credentials manager', NULL, TRUE, TRUE, 1) ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- The owner holds every workspace permission.
INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01', p.realm, TRUE, p.key, p.delegable
FROM permissions AS p
WHERE p.realm = 'workspace' ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02', p.realm, TRUE, p.key, p.delegable
FROM permissions AS p
WHERE p.key IN ('dashboard.read', 'leads.read', 'leads.write', 'leads.import', 'outreach.generate',
                'members.read', 'customers.read', 'customers.write', 'projects.read', 'projects.write',
                'tasks.write', 'files.read', 'files.write',
                'credentials.read') ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a03', p.realm, TRUE, p.key, p.delegable
FROM permissions AS p
WHERE p.key IN ('credentials.reveal') ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES users (id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS system_actor_key TEXT;
--> statement-breakpoint
-- NOT VALID: enforced for every new or changed row; rows migrated from lead_activities stay untouched.
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'activities_actor_check'
          AND conrelid = 'activities'::regclass
    ) THEN
ALTER TABLE activities
    ADD CONSTRAINT activities_actor_check CHECK (
        (actor_type IN ('user', 'customer') AND actor_user_id IS NOT NULL AND system_actor_key IS NULL)
            OR (actor_type IN ('system') AND system_actor_key IS NOT NULL AND BTRIM(system_actor_key) <> '' AND
                actor_user_id IS NULL)
        ) NOT VALID;
END IF;
END
$$;
