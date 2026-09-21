-- Task 41 (plans/crm/07-projekte): project line items as full snapshots of a catalog template,
-- plus the two bindable permissions that guard them.

CREATE TABLE IF NOT EXISTS project_line_items
(
    id                         UUID PRIMARY KEY,
    project_id                 UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    source_line_item_template_id UUID REFERENCES line_item_templates (id) ON DELETE SET NULL,
    title                      TEXT        NOT NULL,
    description                TEXT        NOT NULL,
    price_cents                INTEGER     NOT NULL,
    pricing_mode               TEXT        NOT NULL,
    recurring_interval         TEXT,
    version                    INTEGER     NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT project_line_items_title_check CHECK (btrim(title) <> ''),
    CONSTRAINT project_line_items_price_cents_check CHECK (price_cents >= 0),
    CONSTRAINT project_line_items_pricing_mode_check CHECK (pricing_mode IN ('one_time', 'recurring', 'rate')),
    CONSTRAINT project_line_items_recurring_interval_check CHECK (recurring_interval IS NULL OR
                                                                recurring_interval IN ('monthly', 'yearly')),
    CONSTRAINT project_line_items_pricing_mode_interval_consistency_check CHECK ((pricing_mode = 'recurring') =
                                                                               (recurring_interval IS NOT NULL)),
    CONSTRAINT project_line_items_version_check CHECK (version > 0)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS project_line_items_project_created_at_idx
    ON project_line_items (project_id, created_at DESC);
--> statement-breakpoint

-- Bindable, unlike the workspace-wide catalog permissions from 0031: a customer binding reaches
-- every project of that customer, a project binding only its own project.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('project_line_items.read', 'workspace', TRUE, TRUE, 'View the services assigned to a project.'),
       ('project_line_items.write', 'workspace', TRUE, TRUE, 'Assign and edit the services of a project.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- The owner-role INSERT in 0024 only ran once, against the permissions that existed back then;
-- new catalog entries are granted to the existing system roles explicitly here.
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
         CROSS JOIN roles AS r
WHERE p.key IN ('project_line_items.read', 'project_line_items.write')
  AND r.id IN ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01', '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02')
ON CONFLICT (role_id, permission_key) DO NOTHING;
