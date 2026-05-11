-- Transitional lead import script for PostgreSQL / psql.
--
-- Purpose:
-- - mirror the current createLead() behavior from the app
-- - import one or more leads from a CSV without waiting for the final CSV importer
-- - keep the mapping explicit so an AI can convert CSV -> SQL without guessing
--
-- This script inserts into:
-- - leads
-- - lead_social_profiles
-- - lead_activities
--
-- It does NOT create:
-- - lead_submissions
-- - lead_call_contacts
-- - lead_email_contacts
-- - lead_project_requests
--
-- Required runtime:
-- - PostgreSQL
-- - psql, because \copy is used to load the CSV
-- - pgcrypto, because the schema uses gen_random_uuid() in migrations
--
-- CSV contract:
-- - one row per lead
-- - file: mockups/lead-import-workaround/lead-import-workaround.csv
-- - header must match the \copy column list below
--
-- Required lead fields:
-- - email
-- - at least one of last_name or company_name
--
-- Optional lead fields:
-- - first_name
-- - phone
-- - website_url
-- - category_id
-- - category_slug
-- - category_label_key
-- - score
-- - owner
-- - notes
-- - lead_status
-- - improvements_json
-- - social_profiles_json
--
-- Notes:
-- - source is fixed to 'manual' to match createLead()
-- - lead_status defaults to 'new' when empty
-- - category_id wins over category_slug, and category_slug wins over category_label_key
-- - category lookup happens against lead_categories.id / lead_categories.slug / lead_categories.label_key
-- - improvements_json must be a JSON array of strings or empty
-- - social_profiles_json must be a JSON array of objects with platform, profile_url, normalized_url
-- - normalized_url must already be normalized in the CSV data
--   (tracking params removed, trailing slashes removed on non-root paths)
-- - if you only know a category slug, put it in category_slug and leave category_id empty
-- - if you already know the UUID, put it in category_id and leave the lookup columns empty
--
-- Category lookup examples:
-- SELECT id FROM lead_categories WHERE slug = 'coaches';
-- SELECT id FROM lead_categories WHERE label_key = 'coaches';
-- SELECT id, slug, label_key FROM lead_categories ORDER BY sort_order;

BEGIN;

CREATE
TEMP TABLE lead_import_stage (
  lead_id uuid NOT NULL DEFAULT gen_random_uuid(),
  row_key text,
  first_name text,
  last_name text,
  company_name text,
  email text,
  phone text,
  website_url text,
  category_id text,
  category_slug text,
  category_label_key text,
  score text,
  owner text,
  notes text,
  lead_status text,
  improvements_json text,
  social_profiles_json text
) ON COMMIT DROP;

\
copy lead_import_stage (
    row_key,
    first_name,
    last_name,
    company_name,
    email,
    phone,
    website_url,
    category_id,
    category_slug,
    category_label_key,
    score,
    owner,
    notes,
    lead_status,
    improvements_json,
    social_profiles_json
    ) FROM 'mockups/lead-import-workaround/lead-import-workaround.csv' WITH (
    FORMAT csv,
    HEADER true,
    ENCODING 'UTF8'
    );

CREATE
TEMP TABLE lead_import_resolved AS
SELECT s.lead_id,
       NULLIF(BTRIM(s.row_key), '')            AS row_key,
       NULLIF(BTRIM(s.first_name), '')         AS first_name,
       NULLIF(BTRIM(s.last_name), '')          AS last_name,
       NULLIF(BTRIM(s.company_name), '')       AS company_name,
       NULLIF(BTRIM(s.email), '')              AS email,
       NULLIF(BTRIM(s.phone), '')              AS phone,
       NULLIF(BTRIM(s.website_url), '')        AS website_url,
       NULLIF(BTRIM(s.category_id), '')::uuid AS direct_category_id, NULLIF(BTRIM(s.category_slug), '') AS category_slug,
       NULLIF(BTRIM(s.category_label_key), '') AS category_label_key,
       CASE
           WHEN NULLIF(BTRIM(s.score), '') IS NULL THEN NULL
           ELSE NULLIF(BTRIM(s.score), '')::integer
END
AS score,
  NULLIF(BTRIM(s.owner), '') AS owner,
  NULLIF(BTRIM(s.notes), '') AS notes,
  COALESCE(NULLIF(BTRIM(s.lead_status), ''), 'new') AS lead_status,
  NULLIF(BTRIM(s.improvements_json), '')::jsonb AS improvements_json,
  NULLIF(BTRIM(s.social_profiles_json), '')::jsonb AS social_profiles_json,
  COALESCE(c_direct.id, c_slug.id, c_label.id) AS resolved_category_id
FROM lead_import_stage s
LEFT JOIN lead_categories c_direct
  ON c_direct.id = NULLIF(BTRIM(s.category_id), '')::uuid
LEFT JOIN lead_categories c_slug
  ON c_slug.slug = NULLIF(BTRIM(s.category_slug), '')
LEFT JOIN lead_categories c_label
  ON c_label.label_key = NULLIF(BTRIM(s.category_label_key), '');

DO
$$
BEGIN
  IF
EXISTS (
    SELECT 1
    FROM lead_import_resolved
    WHERE email IS NULL
       OR (last_name IS NULL AND company_name IS NULL)
  ) THEN
    RAISE EXCEPTION
      'Each row needs email and at least one of last_name or company_name';
END IF;

  IF
EXISTS (
    SELECT 1
    FROM lead_import_resolved
    WHERE score IS NOT NULL
      AND (score < 0 OR score > 100)
  ) THEN
    RAISE EXCEPTION 'Score must be between 0 and 100';
END IF;

  IF
EXISTS (
    SELECT 1
    FROM lead_import_resolved
    WHERE lead_status NOT IN (
      'new',
      'contacted',
      'qualified',
      'proposal',
      'on_hold',
      'won',
      'lost',
      'archived'
    )
  ) THEN
    RAISE EXCEPTION 'lead_status must be one of the allowed Lead status values';
END IF;

  IF
EXISTS (
    SELECT 1
    FROM lead_import_resolved
    WHERE (
      direct_category_id IS NOT NULL
      OR NULLIF(BTRIM(category_slug), '') IS NOT NULL
      OR NULLIF(BTRIM(category_label_key), '') IS NOT NULL
    )
    AND resolved_category_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Category could not be resolved from category_id, category_slug or category_label_key';
END IF;
END $$;

INSERT INTO leads (id,
                   first_name,
                   last_name,
                   company_name,
                   email,
                   phone,
                   website_url,
                   category_id,
                   score,
                   source,
                   lead_status,
                   owner,
                   notes,
                   improvements,
                   created_at,
                   updated_at)
SELECT lead_id,
       first_name,
       last_name,
       company_name,
       email,
       phone,
       website_url,
       resolved_category_id,
       score,
       'manual',
       lead_status,
       owner,
       notes,
       CASE
           WHEN improvements_json IS NULL THEN NULL
           WHEN jsonb_typeof(improvements_json) = 'array' THEN (SELECT COALESCE(array_agg(value), ARRAY[]::text[])
                                                                FROM jsonb_array_elements_text(improvements_json) AS value
    )
    ELSE NULL
END
,
  NOW(),
  NOW()
FROM lead_import_resolved;

INSERT INTO lead_social_profiles (id,
                                  lead_id,
                                  platform,
                                  profile_url,
                                  normalized_url,
                                  created_at,
                                  updated_at)
SELECT gen_random_uuid(),
       r.lead_id,
       sp.platform,
       sp.profile_url,
       sp.normalized_url,
       NOW(),
       NOW()
FROM lead_import_resolved r
         CROSS JOIN LATERAL jsonb_to_recordset(
                                               COALESCE(r.social_profiles_json, '[]'::jsonb)
    ) AS sp(
  platform text,
  profile_url text,
  normalized_url text
);

INSERT INTO lead_activities (id,
                             lead_id,
                             type,
                             title,
                             body,
                             metadata,
                             occurred_at,
                             actor_type,
                             actor_id,
                             actor_label,
                             created_at)
SELECT gen_random_uuid(),
       lead_id,
       'note',
       NULL,
       NULL,
       NULL,
       NOW(),
       'system',
       NULL,
       NULL,
       NOW()
FROM lead_import_resolved;

-- Verification: show the inserted leads with the resolved category info.
SELECT l.id,
       l.email,
       l.first_name,
       l.last_name,
       l.company_name,
       l.lead_status,
       l.source,
       l.score,
       l.owner,
       lc.slug      AS category_slug,
       lc.label_key AS category_label_key
FROM leads l
         LEFT JOIN lead_categories lc ON lc.id = l.category_id
WHERE l.id IN (SELECT lead_id FROM lead_import_stage)
ORDER BY l.created_at DESC;

COMMIT;
