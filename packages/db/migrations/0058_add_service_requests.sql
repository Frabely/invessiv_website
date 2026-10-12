-- Ordner 13c (plans/crm/13c-portal-leistungsanfragen), Tasks 74-76 in one migration:
--   1. catalog kinds, project mode and portal release on line items (Task 74)
--   2. service_requests with the workspace permissions (Task 75), including what was offered
--   3. portal permissions for requesting services (Task 76)
-- Additive and idempotent.

-- Task 74 (plans/crm/13c-portal-leistungsanfragen): catalog entries get a kind, a project mode and
-- a portal release; project line items get the kind snapshot and a quantity for purchased hours.
-- Additive and idempotent. The new columns are nullable on purpose: the previous app version
-- does not write them, and NULL reads as the plain value (standard / existing_project / not
-- released). The write path sets every one of them from now on.

ALTER TABLE line_item_templates ADD COLUMN IF NOT EXISTS kind TEXT;
--> statement-breakpoint
ALTER TABLE line_item_templates ADD COLUMN IF NOT EXISTS project_mode TEXT;
--> statement-breakpoint
ALTER TABLE line_item_templates ADD COLUMN IF NOT EXISTS portal_requestable BOOLEAN;
--> statement-breakpoint
ALTER TABLE line_item_templates ADD COLUMN IF NOT EXISTS portal_description TEXT;
--> statement-breakpoint

ALTER TABLE line_item_templates DROP CONSTRAINT IF EXISTS line_item_templates_kind_check;
--> statement-breakpoint
ALTER TABLE line_item_templates
    ADD CONSTRAINT line_item_templates_kind_check CHECK (kind IS NULL OR kind IN ('standard', 'hours', 'feedback_round'));
--> statement-breakpoint

ALTER TABLE line_item_templates DROP CONSTRAINT IF EXISTS line_item_templates_project_mode_check;
--> statement-breakpoint
ALTER TABLE line_item_templates
    ADD CONSTRAINT line_item_templates_project_mode_check CHECK (
        project_mode IS NULL OR project_mode IN ('existing_project', 'new_project')
    );
--> statement-breakpoint

-- Hours are sold at a rate, an extra feedback round at a one-off price.
ALTER TABLE line_item_templates DROP CONSTRAINT IF EXISTS line_item_templates_kind_pricing_mode_check;
--> statement-breakpoint
ALTER TABLE line_item_templates
    ADD CONSTRAINT line_item_templates_kind_pricing_mode_check CHECK (
        (kind IS DISTINCT FROM 'hours' OR pricing_mode = 'rate')
        AND (kind IS DISTINCT FROM 'feedback_round' OR pricing_mode = 'one_time')
    );
--> statement-breakpoint

-- Both act on a project that exists: hours are allocated to it, a round is added to its track.
ALTER TABLE line_item_templates DROP CONSTRAINT IF EXISTS line_item_templates_kind_project_mode_check;
--> statement-breakpoint
ALTER TABLE line_item_templates
    ADD CONSTRAINT line_item_templates_kind_project_mode_check CHECK (
        kind IS NULL OR kind = 'standard' OR project_mode IS DISTINCT FROM 'new_project'
    );
--> statement-breakpoint

-- A released entry always carries the text customers read; the internal description never reaches them.
ALTER TABLE line_item_templates DROP CONSTRAINT IF EXISTS line_item_templates_portal_description_check;
--> statement-breakpoint
ALTER TABLE line_item_templates
    ADD CONSTRAINT line_item_templates_portal_description_check CHECK (
        (portal_description IS NULL OR length(portal_description) <= 2000)
        AND (portal_requestable IS NOT TRUE OR btrim(coalesce(portal_description, '')) <> '')
    );
--> statement-breakpoint

ALTER TABLE project_line_items ADD COLUMN IF NOT EXISTS kind TEXT;
--> statement-breakpoint
ALTER TABLE project_line_items ADD COLUMN IF NOT EXISTS quantity_minutes INTEGER;
--> statement-breakpoint

ALTER TABLE project_line_items DROP CONSTRAINT IF EXISTS project_line_items_kind_check;
--> statement-breakpoint
ALTER TABLE project_line_items
    ADD CONSTRAINT project_line_items_kind_check CHECK (kind IS NULL OR kind IN ('standard', 'hours', 'feedback_round'));
--> statement-breakpoint

ALTER TABLE project_line_items DROP CONSTRAINT IF EXISTS project_line_items_quantity_minutes_check;
--> statement-breakpoint
ALTER TABLE project_line_items
    ADD CONSTRAINT project_line_items_quantity_minutes_check CHECK (
        quantity_minutes IS NULL
        OR (quantity_minutes > 0 AND quantity_minutes % 15 = 0 AND quantity_minutes <= 600000)
    );
--> statement-breakpoint

-- A quantity exists exactly for purchased hours. IS NOT DISTINCT FROM keeps a NULL kind on the
-- "not hours" side instead of letting the comparison evaluate to NULL and pass.
ALTER TABLE project_line_items DROP CONSTRAINT IF EXISTS project_line_items_kind_quantity_check;
--> statement-breakpoint
ALTER TABLE project_line_items
    ADD CONSTRAINT project_line_items_kind_quantity_check CHECK (
        (quantity_minutes IS NOT NULL) = (kind IS NOT DISTINCT FROM 'hours')
    );
--> statement-breakpoint

-- Widened, never narrowed: purchases credited together with a project line item.
ALTER TABLE customer_hour_purchases DROP CONSTRAINT IF EXISTS customer_hour_purchases_source_check;
--> statement-breakpoint
ALTER TABLE customer_hour_purchases
    ADD CONSTRAINT customer_hour_purchases_source_check CHECK (source IN ('manual', 'project_line_item'));
--> statement-breakpoint

-- Starter catalog: the hourly rate sells hours, a landing page is a project of its own.
UPDATE line_item_templates
SET kind = 'hours'
WHERE id = '9c8f1a10-1b1a-4a10-8e10-000000000007' AND kind IS NULL AND pricing_mode = 'rate';
--> statement-breakpoint
UPDATE line_item_templates
SET project_mode = 'new_project'
WHERE id = '9c8f1a10-1b1a-4a10-8e10-000000000001' AND project_mode IS NULL;
--> statement-breakpoint

-- The price is maintained in the catalog before the entry is released to the portal.
INSERT INTO line_item_templates (id, title, description, price_cents, pricing_mode, recurring_interval, status,
                                 version, kind, project_mode, portal_requestable, portal_description)
VALUES ('9c8f1a10-1b1a-4a10-8e10-000000000008', 'Zusätzliche Feedbackrunde',
        'Eine weitere Feedbackrunde über das vereinbarte Kontingent hinaus.', 0, 'one_time', NULL, 'active', 1,
        'feedback_round', 'existing_project', FALSE, '')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- Service requests (Task 75). What was offered stays on the request, so the acceptance starts from
-- the offer instead of the catalog price; both offer columns are NULL until an offer is recorded.
CREATE UNIQUE INDEX IF NOT EXISTS portal_memberships_id_customer_uidx ON portal_memberships (id, customer_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS service_requests (
id UUID PRIMARY KEY,
customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
line_item_template_id UUID REFERENCES line_item_templates(id) ON DELETE SET NULL,
kind TEXT NOT NULL,
title TEXT NOT NULL,
note TEXT NOT NULL,
requested_minutes INTEGER,
project_wish TEXT NOT NULL,
requested_project_id UUID,
requested_by_membership_id UUID NOT NULL,
status TEXT NOT NULL,
decline_reason TEXT,
offered_at TIMESTAMPTZ,
offered_price_cents INTEGER,
offered_minutes INTEGER,
decided_at TIMESTAMPTZ,
decided_by_member_id UUID REFERENCES workspace_members(id),
project_id UUID,
project_line_item_id UUID REFERENCES project_line_items(id) ON DELETE SET NULL,
idempotency_key UUID NOT NULL,
version INTEGER NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CONSTRAINT service_requests_requested_project_customer_fkey FOREIGN KEY (requested_project_id, customer_id) REFERENCES projects(id, customer_id) ON DELETE CASCADE,
CONSTRAINT service_requests_project_customer_fkey FOREIGN KEY (project_id, customer_id) REFERENCES projects(id, customer_id) ON DELETE CASCADE,
CONSTRAINT service_requests_membership_customer_fkey FOREIGN KEY (requested_by_membership_id, customer_id) REFERENCES portal_memberships(id, customer_id),
CONSTRAINT service_requests_kind_check CHECK (kind IN ('standard','hours','feedback_round')),
CONSTRAINT service_requests_title_check CHECK (btrim(title) <> '' AND length(title) <= 200),
CONSTRAINT service_requests_note_check CHECK (length(note) <= 2000),
CONSTRAINT service_requests_minutes_check CHECK (requested_minutes IS NULL OR (requested_minutes > 0 AND requested_minutes % 15 = 0 AND requested_minutes <= 600000)),
CONSTRAINT service_requests_kind_minutes_check CHECK ((requested_minutes IS NOT NULL) = (kind = 'hours')),
CONSTRAINT service_requests_project_wish_check CHECK (project_wish IN ('existing','new','undecided')),
CONSTRAINT service_requests_wish_project_check CHECK ((project_wish = 'existing') = (requested_project_id IS NOT NULL)),
CONSTRAINT service_requests_status_check CHECK (status IN ('requested','offered','accepted','declined','withdrawn')),
CONSTRAINT service_requests_decline_reason_check CHECK (decline_reason IS NULL OR length(decline_reason) <= 500),
CONSTRAINT service_requests_accepted_check CHECK (status <> 'accepted' OR (project_id IS NOT NULL AND decided_at IS NOT NULL AND decided_by_member_id IS NOT NULL)),
CONSTRAINT service_requests_declined_check CHECK (status <> 'declined' OR (decline_reason IS NOT NULL AND btrim(decline_reason) <> '' AND decided_by_member_id IS NOT NULL)),
CONSTRAINT service_requests_version_check CHECK (version > 0),
CONSTRAINT service_requests_offered_price_check CHECK (offered_price_cents IS NULL OR offered_price_cents >= 0),
CONSTRAINT service_requests_offered_minutes_check CHECK (offered_minutes IS NULL OR (kind = 'hours' AND offered_minutes > 0 AND offered_minutes % 15 = 0 AND offered_minutes <= 600000))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS service_requests_idempotency_key_uidx ON service_requests(idempotency_key);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS service_requests_customer_created_idx ON service_requests(customer_id, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS service_requests_status_created_idx ON service_requests(status, created_at DESC);
--> statement-breakpoint
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('service_requests.read','workspace',TRUE,TRUE,'View customer service requests.'),
('service_requests.write','workspace',TRUE,TRUE,'Offer, decline and accept customer service requests.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key, permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions p CROSS JOIN roles r
WHERE p.key IN ('service_requests.read','service_requests.write')
AND r.id IN ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01','7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02')
ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

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
