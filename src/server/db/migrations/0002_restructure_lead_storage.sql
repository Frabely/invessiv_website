DROP TABLE IF EXISTS lead_project_requests;
--> statement-breakpoint
DROP TABLE IF EXISTS leads;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  lead_status TEXT NOT NULL DEFAULT 'new'
    CHECK (lead_status IN ('new', 'contacted', 'qualified', 'won', 'lost', 'archived')),
  owner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_submissions (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL
    CHECK (channel IN ('project_request', 'quick_contact', 'discovery_call')),
  locale TEXT NOT NULL
    CHECK (locale IN ('de', 'en')),
  consent_accepted_at TIMESTAMPTZ NOT NULL,
  submission_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_project_requests (
  id UUID PRIMARY KEY,
  lead_submission_id UUID NOT NULL UNIQUE REFERENCES lead_submissions(id) ON DELETE CASCADE,
  offer_key TEXT NOT NULL,
  goal_key TEXT,
  workflow_key TEXT,
  budget_key TEXT,
  preferred_start_key TEXT,
  company TEXT,
  role TEXT,
  phone TEXT,
  website TEXT,
  page_keys TEXT[],
  custom_page_names TEXT[],
  project_details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_email_contacts (
  id UUID PRIMARY KEY,
  lead_submission_id UUID NOT NULL UNIQUE REFERENCES lead_submissions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_call_contacts (
  id UUID PRIMARY KEY,
  lead_submission_id UUID NOT NULL UNIQUE REFERENCES lead_submissions(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_lower_uidx
  ON leads (LOWER(BTRIM(email)));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS leads_status_created_at_idx
  ON leads (lead_status, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_submissions_lead_id_created_at_idx
  ON lead_submissions (lead_id, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_submissions_channel_created_at_idx
  ON lead_submissions (channel, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_project_requests_offer_key_idx
  ON lead_project_requests (offer_key);
