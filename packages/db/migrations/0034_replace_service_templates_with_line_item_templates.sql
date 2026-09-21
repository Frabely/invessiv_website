-- Renames the catalog entity from service template to line item template. The catalog only holds the
-- starter rows seeded by 0031, so the table is replaced instead of renamed and the starter rows are
-- seeded again below.

DROP TABLE IF EXISTS service_templates CASCADE;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS line_item_templates
(
    id                 UUID PRIMARY KEY,
    title              TEXT        NOT NULL,
    description        TEXT        NOT NULL,
    price_cents        INTEGER     NOT NULL,
    pricing_mode       TEXT        NOT NULL,
    recurring_interval TEXT,
    status             TEXT        NOT NULL,
    version            INTEGER     NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT line_item_templates_title_check CHECK (btrim(title) <> ''),
    CONSTRAINT line_item_templates_price_cents_check CHECK (price_cents >= 0),
    CONSTRAINT line_item_templates_pricing_mode_check CHECK (pricing_mode IN ('one_time', 'recurring', 'rate')),
    CONSTRAINT line_item_templates_recurring_interval_check CHECK (recurring_interval IS NULL OR
                                                                   recurring_interval IN ('monthly', 'yearly')),
    CONSTRAINT line_item_templates_pricing_mode_interval_consistency_check CHECK ((pricing_mode = 'recurring') =
                                                                                  (recurring_interval IS NOT NULL)),
    CONSTRAINT line_item_templates_status_check CHECK (status IN ('active', 'archived')),
    CONSTRAINT line_item_templates_version_check CHECK (version > 0)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS line_item_templates_status_created_at_idx
    ON line_item_templates (status, created_at DESC);
--> statement-breakpoint

-- The old catalog permissions are replaced, including any custom role that held them.
DELETE
FROM role_permissions
WHERE permission_key IN ('services.read', 'services.write');
--> statement-breakpoint

DELETE
FROM permissions
WHERE key IN ('services.read', 'services.write');
--> statement-breakpoint

INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('line_item_templates.read', 'workspace', TRUE, FALSE, 'View the line item template catalog.'),
       ('line_item_templates.write', 'workspace', TRUE, FALSE,
        'Create, edit and archive line item templates.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
         CROSS JOIN roles AS r
WHERE p.key IN ('line_item_templates.read', 'line_item_templates.write')
  AND r.id IN ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01', '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02')
ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

-- Idempotent starter catalog (00-entscheidungen.md, "Projektleistungen und Templatekatalog").
-- Fixed ids make the insert repeatable; prices are net EUR cents.
INSERT INTO line_item_templates (id, title, description, price_cents, pricing_mode, recurring_interval, status,
                                 version)
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
        'Abrechnung nach tatsächlichem Aufwand.', 10000, 'rate', NULL, 'active', 1)
ON CONFLICT (id) DO NOTHING;
