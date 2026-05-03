-- Drop old per-column NOT NULL checks (auto-named by Postgres from 0002 inline constraints)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_first_name_check;
--> statement-breakpoint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_last_name_check;
--> statement-breakpoint
-- Drop old status check so we can replace it with the extended set
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_status_check;
--> statement-breakpoint
-- Drop old status index (replaced by source index)
DROP INDEX IF EXISTS leads_status_created_at_idx;
--> statement-breakpoint
-- Make first_name and last_name nullable
ALTER TABLE leads ALTER COLUMN first_name DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE leads ALTER COLUMN last_name DROP NOT NULL;
--> statement-breakpoint
-- New columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;
--> statement-breakpoint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
--> statement-breakpoint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_url TEXT;
--> statement-breakpoint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES lead_categories(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER;
--> statement-breakpoint
-- Add source as nullable first so existing rows can be backfilled
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;
--> statement-breakpoint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
--> statement-breakpoint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS improvements TEXT[];
--> statement-breakpoint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_guid TEXT;
--> statement-breakpoint
-- Backfill: all existing rows came from webforms
UPDATE leads SET source = 'webform' WHERE source IS NULL;
--> statement-breakpoint
-- Now enforce NOT NULL on source
ALTER TABLE leads ALTER COLUMN source SET NOT NULL;
--> statement-breakpoint
-- New check constraints
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_last_name_or_company_name_check;
--> statement-breakpoint
ALTER TABLE leads ADD CONSTRAINT leads_last_name_or_company_name_check
  CHECK (NULLIF(BTRIM(last_name), '') IS NOT NULL OR NULLIF(BTRIM(company_name), '') IS NOT NULL);
--> statement-breakpoint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_score_check;
--> statement-breakpoint
ALTER TABLE leads ADD CONSTRAINT leads_score_check
  CHECK (score IS NULL OR (score >= 0 AND score <= 100));
--> statement-breakpoint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
--> statement-breakpoint
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN ('webform', 'manual', 'import'));
--> statement-breakpoint
-- Replace lead_status check with extended set (includes proposal, on_hold, archived)
ALTER TABLE leads ADD CONSTRAINT leads_lead_status_check
  CHECK (lead_status IN ('new', 'contacted', 'qualified', 'proposal', 'on_hold', 'won', 'lost', 'archived'));
--> statement-breakpoint
-- New indexes
CREATE INDEX IF NOT EXISTS leads_source_created_at_idx
  ON leads (source, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS leads_category_created_at_idx
  ON leads (category_id, created_at DESC);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS leads_external_guid_uidx
  ON leads (external_guid)
  WHERE external_guid IS NOT NULL;
