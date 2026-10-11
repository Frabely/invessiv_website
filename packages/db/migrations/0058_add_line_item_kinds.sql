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
