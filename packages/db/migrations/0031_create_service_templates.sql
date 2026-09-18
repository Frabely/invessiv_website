-- Task 40 (plans/crm/07-projekte): maintainable global service catalog plus its two new
-- workspace-wide, non-scopable permissions.

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
    CONSTRAINT service_templates_pricing_mode_check CHECK
(
    pricing_mode
    IN
(
    'one_time',
    'recurring',
    'rate'
)),
    CONSTRAINT service_templates_recurring_interval_check CHECK
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
)
    ),
    CONSTRAINT service_templates_pricing_mode_interval_consistency_check CHECK
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
)
    ),
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
INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01', p.realm, TRUE, p.key, p.delegable
FROM permissions AS p
WHERE p.key IN ('services.read', 'services.write') ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02', p.realm, TRUE, p.key, p.delegable
FROM permissions AS p
WHERE p.key IN ('services.read', 'services.write') ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

-- Idempotent starter catalog (00-entscheidungen.md, "Projektleistungen und Templatekatalog").
-- Fixed ids make the insert repeatable; prices are net EUR cents.
INSERT INTO service_templates (id, title, description, price_cents, pricing_mode, recurring_interval, status, version)
VALUES ('9c8f1a10-1b1a-4a10-8e10-000000000001', 'Landingpage',
        'Einseitige Website inklusive Konzept, Design, Umsetzung und Basis-SEO.', 200000, 'one_time', NULL, 'active',
        1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000002', 'Unterseite',
        'Zusätzliche Unterseite innerhalb einer bestehenden Website.', 75000, 'one_time', NULL, 'active', 1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000003', 'Zusätzliche Section',
        'Zusätzlicher Abschnitt innerhalb einer bestehenden Seite.', 25000, 'one_time', NULL, 'active', 1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000004', 'Wartung',
        'Laufende technische Pflege, Updates und Support.', 10000, 'recurring', 'monthly', 'active', 1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000005', 'SEO',
        'Laufende Suchmaschinenoptimierung.', 25000, 'recurring', 'monthly', 'active', 1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000006', 'Wartung + SEO',
        'Kombination aus laufender Wartung und SEO.', 30000, 'recurring', 'monthly', 'active', 1),
       ('9c8f1a10-1b1a-4a10-8e10-000000000007', 'Stundensatz',
        'Abrechnung nach tatsächlichem Aufwand.', 10000, 'rate', NULL, 'active', 1) ON CONFLICT (id) DO NOTHING;
