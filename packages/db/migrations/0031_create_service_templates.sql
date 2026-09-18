-- Tasks 36 and 40 (plans/crm/07-projekte): service catalog and scoped role assignments.

CREATE TABLE IF NOT EXISTS service_templates
(
    id
    UUID
    PRIMARY
    KEY,
    title
    TEXT
    NOT
    NULL,
    description
    TEXT
    NOT
    NULL,
    price_cents
    INTEGER
    NOT
    NULL,
    pricing_mode
    TEXT
    NOT
    NULL,
    recurring_interval
    TEXT,
    status
    TEXT
    NOT
    NULL,
    version
    INTEGER
    NOT
    NULL,
    created_at
    TIMESTAMPTZ
    NOT
    NULL
    DEFAULT
    NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT service_templates_title_check CHECK
(
    btrim
(
    title
) <> ''),
    CONSTRAINT service_templates_price_cents_check CHECK
(
    price_cents
    >=
    0
),
    CONSTRAINT service_templates_pricing_mode_check
    CHECK
(
    pricing_mode
    IN
(
    'one_time',
    'recurring',
    'rate'
)),
    CONSTRAINT service_templates_recurring_interval_check
    CHECK
(
    recurring_interval
    IS
    NULL
    OR
    recurring_interval
    IN
(
    'monthly',
    'yearly'
)),
    CONSTRAINT service_templates_pricing_mode_interval_consistency_check
    CHECK
(
(
    pricing_mode =
    'recurring'
) =
(
    recurring_interval
    IS
    NOT
    NULL
)),
    CONSTRAINT service_templates_status_check CHECK
(
    status
    IN
(
    'active',
    'archived'
)),
    CONSTRAINT service_templates_version_check CHECK
(
    version >
    0
)
    );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS service_templates_status_created_at_idx
    ON service_templates (status, created_at DESC);
--> statement-breakpoint

INSERT INTO permissions (key, realm, delegable, description)
VALUES ('services.read', 'workspace', TRUE, 'View the service template catalog.'),
       ('services.write', 'workspace', TRUE,
        'Create, edit and archive service templates.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- The owner-role INSERT in 0024 only ran once, against the permissions that existed back then;
-- new catalog entries are granted to existing system roles explicitly here.
INSERT INTO role_permissions (role_id,
                              realm,
                              role_is_system,
                              permission_key,
                              permission_delegable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01',
       p.realm,
       TRUE,
       p.key,
       p.delegable
FROM permissions AS p
WHERE p.key IN ('services.read', 'services.write') ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id,
                              realm,
                              role_is_system,
                              permission_key,
                              permission_delegable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02',
       p.realm,
       TRUE,
       p.key,
       p.delegable
FROM permissions AS p
WHERE p.key IN ('services.read', 'services.write') ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

-- Idempotent starter catalog (00-entscheidungen.md, "Projektleistungen und Templatekatalog").
-- Fixed ids make the insert repeatable; prices are net EUR cents.
INSERT INTO service_templates (id,
                               title,
                               description,
                               price_cents,
                               pricing_mode,
                               recurring_interval,
                               status,
                               version)
VALUES ('9c8f1a10-1b1a-4a10-8e10-000000000001',
        'Landingpage',
        'Einseitige Website inklusive Konzept, Design, Umsetzung und Basis-SEO.',
        200000,
        'one_time',
        NULL,
        'active',
        1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000002',
        'Unterseite',
        'Zusätzliche Unterseite innerhalb einer bestehenden Website.',
        75000,
        'one_time',
        NULL,
        'active',
        1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000003',
        'Zusätzliche Section',
        'Zusätzlicher Abschnitt innerhalb einer bestehenden Seite.',
        25000,
        'one_time',
        NULL,
        'active',
        1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000004',
        'Wartung',
        'Laufende technische Pflege, Updates und Support.',
        10000,
        'recurring',
        'monthly',
        'active',
        1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000005',
        'SEO',
        'Laufende Suchmaschinenoptimierung.',
        25000,
        'recurring',
        'monthly',
        'active',
        1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000006',
        'Wartung + SEO',
        'Kombination aus laufender Wartung und SEO.',
        30000,
        'recurring',
        'monthly',
        'active',
        1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000007',
        'Stundensatz',
        'Abrechnung nach tatsächlichem Aufwand.',
        10000,
        'rate',
        NULL,
        'active',
        1) ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- Nullable flags keep this expand migration compatible with the previous application
-- version; Task 38 tightens them to NOT NULL.
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
  AND (
    rp.role_scope_assignable IS NULL
   OR rp.permission_scope_assignable IS NULL
    );
--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE permissions
    ADD CONSTRAINT permissions_key_realm_scope_assignable_unique
        UNIQUE (key, realm, scope_assignable);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO
$$
BEGIN
ALTER TABLE roles
    ADD CONSTRAINT roles_id_realm_scope_assignable_unique
        UNIQUE (id, realm, scope_assignable);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE roles
    ADD CONSTRAINT roles_system_scope_assignable_check
        CHECK (NOT (is_system AND scope_assignable));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO
$$
BEGIN
ALTER TABLE role_permissions
    ADD CONSTRAINT role_permissions_scope_assignable_check
        CHECK (NOT role_scope_assignable OR permission_scope_assignable);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE role_permissions
    ADD CONSTRAINT role_permissions_scope_role_foreign_key
        FOREIGN KEY (role_id, realm, role_scope_assignable)
            REFERENCES roles (id, realm, scope_assignable)
            ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO
$$
BEGIN
ALTER TABLE role_permissions
    ADD CONSTRAINT role_permissions_scope_permission_foreign_key
        FOREIGN KEY (permission_key, realm, permission_scope_assignable)
            REFERENCES permissions (key, realm, scope_assignable)
            ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
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
    CONSTRAINT workspace_member_scoped_roles_scope_assignable_check
    CHECK
(
    role_scope_assignable
),
    customer_id UUID NOT NULL REFERENCES customers
(
    id
)
  ON DELETE RESTRICT,
    project_id UUID,
    assigned_by_user_id UUID NOT NULL
    REFERENCES users
(
    id
)
  ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT workspace_member_scoped_roles_realm_check
    CHECK
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
    ON workspace_member_scoped_roles (project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS workspace_member_scoped_roles_role_index
    ON workspace_member_scoped_roles (role_id);
--> statement-breakpoint

ALTER TABLE security_events
DROP
CONSTRAINT IF EXISTS security_events_type_check;
ALTER TABLE security_events
    ADD CONSTRAINT security_events_type_check
        CHECK (
            type IN (
                     'workspace_owner_bootstrapped',
                     'workspace_member_added',
                     'workspace_member_roles_changed',
                     'workspace_owner_granted',
                     'workspace_owner_revoked',
                     'workspace_member_deactivated',
                     'workspace_member_activated',
                     'workspace_responsibilities_handed_over',
                     'role_created',
                     'role_updated',
                     'workspace_member_access_scope_granted',
                     'workspace_member_access_scope_revoked'
                )
            );
