CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  source_form TEXT NOT NULL,
  locale TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  role TEXT,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  consent_accepted_at TIMESTAMPTZ NOT NULL,
  privacy_version TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  submission_started_at TIMESTAMPTZ NOT NULL,
  mail_status TEXT NOT NULL CHECK (mail_status IN ('pending', 'sent', 'failed')),
  mail_provider TEXT NOT NULL,
  mail_error_code TEXT,
  lead_status TEXT NOT NULL CHECK (lead_status IN ('new', 'contacted', 'qualified', 'won', 'lost', 'archived')),
  owner TEXT,
  first_contacted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  internal_note TEXT,
  retention_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (lead_status, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS leads_source_form_idx ON leads (source_form, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_project_requests (
  lead_id UUID PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  goal_key TEXT,
  workflow_key TEXT,
  budget_key TEXT,
  preferred_start_key TEXT,
  website TEXT,
  page_keys TEXT[],
  pages_custom TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
