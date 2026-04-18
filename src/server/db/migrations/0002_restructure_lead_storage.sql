DROP TABLE IF EXISTS lead_project_requests;
--> statement-breakpoint
DROP TABLE IF EXISTS leads;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION text_array_has_unique_values(input_values TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT
    input_values IS NULL OR
    cardinality(input_values) = (
      SELECT COUNT(DISTINCT value)
      FROM unnest(input_values) AS value
    );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION text_array_items_are_trimmed_and_bounded(
  input_values TEXT[],
  max_length INTEGER
)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT
    input_values IS NULL OR
    NOT EXISTS (
      SELECT 1
      FROM unnest(input_values) AS value
      WHERE BTRIM(value) = ''
        OR value <> BTRIM(value)
        OR char_length(value) > max_length
    );
$$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL CHECK (BTRIM(first_name) <> ''),
  last_name TEXT NOT NULL CHECK (BTRIM(last_name) <> ''),
  email TEXT NOT NULL CHECK (BTRIM(email) <> ''),
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
  request_id TEXT NOT NULL UNIQUE CHECK (BTRIM(request_id) <> ''),
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
  offer_key TEXT NOT NULL
    CHECK (offer_key IN ('landing', 'maintenance', 'process', 'upgrade', 'web')),
  goal_key TEXT
    CHECK (
      goal_key IS NULL OR
      goal_key IN (
        'generate_inquiries',
        'increase_bookings',
        'sell_product',
        'grow_newsletter',
        'other_goal'
      )
    ),
  workflow_key TEXT
    CHECK (
      workflow_key IS NULL OR
      workflow_key IN (
        'digitize_existing_process',
        'simplify_manual_process',
        'connect_data_or_systems',
        'build_internal_tool',
        'improve_existing_tool',
        'other_process'
      )
    ),
  budget_key TEXT
    CHECK (
      budget_key IS NULL OR
      budget_key IN (
        'below_1000',
        'between_1000_2500',
        'between_2500_5000',
        'between_5000_10000',
        'above_10000',
        'open'
      )
    ),
  preferred_start_key TEXT
    CHECK (
      preferred_start_key IS NULL OR
      preferred_start_key IN (
        'immediately',
        'within_two_weeks',
        'within_one_month',
        'later_flexible'
      )
    ),
  company TEXT,
  role TEXT,
  phone TEXT,
  website TEXT,
  page_keys TEXT[]
    CHECK (
      page_keys IS NULL OR
      (
        page_keys <@ ARRAY[
          'home',
          'services',
          'about',
          'contact',
          'careers',
          'blog',
          'landing_page'
        ]::TEXT[] AND
        text_array_has_unique_values(page_keys)
      )
    ),
  custom_page_names TEXT[]
    CHECK (
      custom_page_names IS NULL OR
      (
        cardinality(custom_page_names) <= 12 AND
        text_array_items_are_trimmed_and_bounded(custom_page_names, 120) AND
        text_array_has_unique_values(custom_page_names)
      )
    ),
  project_details TEXT NOT NULL CHECK (BTRIM(project_details) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_email_contacts (
  id UUID PRIMARY KEY,
  lead_submission_id UUID NOT NULL UNIQUE REFERENCES lead_submissions(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (BTRIM(message) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_call_contacts (
  id UUID PRIMARY KEY,
  lead_submission_id UUID NOT NULL UNIQUE REFERENCES lead_submissions(id) ON DELETE CASCADE,
  message TEXT CHECK (message IS NULL OR BTRIM(message) <> ''),
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
