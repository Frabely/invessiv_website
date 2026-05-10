-- HubSpot CSV -> PostgreSQL import bridge for the temporary lead workflow.
--
-- Goal:
-- - take the HubSpot export at
--   `mockups/lead-import-workaround/hubspot-crm-exports-10leads-2026-05-10.csv`
-- - convert it into ready-to-execute SQL inserts
-- - mirror `createLead()` as closely as possible until the real importer exists
--
-- Use this script with `psql`.
--
-- What it inserts:
-- - leads
-- - lead_social_profiles
-- - lead_activities
--
-- What it does not create:
-- - lead_submissions
-- - lead_call_contacts
-- - lead_email_contacts
-- - lead_project_requests
--
-- Required lead fields:
-- - E-Mail
-- - at least one of Nachname or a mechanical company-name fallback
--
-- Fixed mappings from HubSpot CSV to DB:
-- - Datensatz-ID       -> leads.external_guid
-- - Vorname            -> leads.first_name
-- - Nachname           -> leads.last_name
-- - Leadstatus         -> leads.lead_status
-- - score               -> leads.score
-- - kategorie          -> lead_categories.slug lookup
-- - LinkedIn-URL       -> lead_social_profiles.profile_url
-- - Website-URL        -> leads.website_url
-- - verbesserung_1..3  -> leads.improvements[]
-- - Erstellungsdatum   -> leads.created_at
-- - E-Mail             -> leads.email
--
-- Status mapping:
-- - Kontakt aufgenommen -> contacted
-- - In Bearbeitung      -> new
-- - unknown / blank     -> new, because createLead() defaults to new
--
-- Category mapping:
-- - Berater               -> consultants
-- - Coaches               -> coaches
-- - Fotografen            -> photographers
-- - Handwerker            -> craftspeople
-- - kleine B2B-Anbieter   -> small-b2b-providers
-- - lokale Dienstleister  -> local-service-providers
-- - unknown / blank       -> NULL
--
-- Important:
-- - unknown categories are deliberately left empty
-- - this script does not invent a category
-- - if a row has no Nachname, a mechanical company-name fallback is derived
--   from Website-URL or LinkedIn-URL so the row still satisfies createLead()
-- - if you want a human-curated company name, replace the fallback manually
--
-- Category lookup helper:
-- SELECT id, slug, label_key
-- FROM lead_categories
-- ORDER BY sort_order;
--
-- The script mirrors the app behavior:
-- - source is fixed to 'manual'
-- - the initial activity is inserted as a system note
-- - LinkedIn URLs get a normalized profile URL

\set
ON_ERROR_STOP on

BEGIN;

CREATE
TEMP TABLE hubspot_lead_stage (
  external_guid text,
  first_name text,
  last_name text,
  lead_status_raw text,
  score_raw text,
  category_raw text,
  linkedin_url text,
  website_url text,
  improvement_1 text,
  improvement_2 text,
  improvement_3 text,
  created_at_raw text,
  email text
) ON COMMIT DROP;

\
copy hubspot_lead_stage (
    external_guid,
    first_name,
    last_name,
    lead_status_raw,
    score_raw,
    category_raw,
    linkedin_url,
    website_url,
    improvement_1,
    improvement_2,
    improvement_3,
    created_at_raw,
    email
    ) FROM 'mockups/lead-import-workaround/hubspot-crm-exports-10leads-2026-05-10.csv' WITH (
    FORMAT csv,
    HEADER true,
    ENCODING 'UTF8'
    );

CREATE
TEMP TABLE hubspot_lead_resolved AS
WITH category_map(raw_value, slug_value) AS (
  VALUES
    ('Berater', 'consultants'),
    ('Coaches', 'coaches'),
    ('Fotografen', 'photographers'),
    ('Handwerker', 'craftspeople'),
    ('kleine B2B-Anbieter', 'small-b2b-providers'),
    ('lokale Dienstleister', 'local-service-providers')
),
status_map(raw_value, lead_status_value) AS (
  VALUES
    ('Kontakt aufgenommen', 'contacted'),
    ('In Bearbeitung', 'new')
)
SELECT gen_random_uuid()                  AS lead_id,
       NULLIF(BTRIM(s.external_guid), '') AS external_guid,
       NULLIF(BTRIM(s.first_name), '')    AS first_name,
       NULLIF(BTRIM(s.last_name), '')     AS last_name,
       NULLIF(BTRIM(s.email), '')         AS email,
       NULLIF(BTRIM(s.website_url), '')   AS website_url,
       NULLIF(BTRIM(s.linkedin_url), '')  AS linkedin_url,
       CASE
           WHEN NULLIF(BTRIM(s.score_raw), '') IS NULL THEN NULL
           ELSE NULLIF(BTRIM(s.score_raw), '')::numeric::integer
END
AS score,
  COALESCE(status_map.lead_status_value, 'new') AS lead_status,
  category_categories.id AS category_id,
  CASE
    WHEN NULLIF(BTRIM(s.improvement_1), '') IS NULL
     AND NULLIF(BTRIM(s.improvement_2), '') IS NULL
     AND NULLIF(BTRIM(s.improvement_3), '') IS NULL
      THEN NULL
    ELSE array_remove(
      ARRAY[
        NULLIF(BTRIM(s.improvement_1), ''),
        NULLIF(BTRIM(s.improvement_2), ''),
        NULLIF(BTRIM(s.improvement_3), '')
      ],
      NULL
    )
END
AS improvements,
  CASE
    WHEN NULLIF(BTRIM(s.created_at_raw), '') IS NULL THEN NOW()
    ELSE NULLIF(BTRIM(s.created_at_raw), '')::timestamp AT TIME ZONE 'Europe/Berlin'
END
AS created_at_value,
  CASE
    WHEN NULLIF(BTRIM(s.linkedin_url), '') IS NULL THEN NULL
    ELSE regexp_replace(
      regexp_replace(BTRIM(s.linkedin_url), '[?#].*$', '', 'g'),
      '/+$',
      ''
    )
END
AS normalized_linkedin_url,
  CASE
    WHEN NULLIF(BTRIM(s.last_name), '') IS NOT NULL THEN NULLIF(BTRIM(s.last_name), '')
    WHEN NULLIF(BTRIM(s.website_url), '') IS NOT NULL THEN
      initcap(
        regexp_replace(
          split_part(
            regexp_replace(
              regexp_replace(BTRIM(s.website_url), '^https?://(www\\.)?', '', 'i'),
              '[/?#].*$',
              ''
            ),
            '.',
            1
          ),
          '[-_]+',
          ' ',
          'g'
        )
      )
    WHEN NULLIF(BTRIM(s.linkedin_url), '') IS NOT NULL AND s.linkedin_url ~* '/company/' THEN
      initcap(
        regexp_replace(
          regexp_replace(
            regexp_replace(s.linkedin_url, '^.*?/company/([^/?#]+).*$','\\1', 'i'),
            '[-_]+',
            ' ',
            'g'
          ),
          '/+$',
          ''
        )
      )
    WHEN NULLIF(BTRIM(s.linkedin_url), '') IS NOT NULL AND s.linkedin_url ~* '/in/' THEN
      initcap(
        regexp_replace(
          regexp_replace(
            regexp_replace(s.linkedin_url, '^.*?/in/([^/?#]+).*$','\\1', 'i'),
            '[-_]+',
            ' ',
            'g'
          ),
          '/+$',
          ''
        )
      )
    ELSE NULL
END
AS company_name_fallback
FROM hubspot_lead_stage s
LEFT JOIN status_map
  ON status_map.raw_value = NULLIF(BTRIM(s.lead_status_raw), '')
LEFT JOIN category_map
  ON category_map.raw_value = NULLIF(BTRIM(s.category_raw), '')
LEFT JOIN lead_categories category_categories
  ON category_categories.slug = category_map.slug_value;

DO
$$
BEGIN
  IF
EXISTS (
    SELECT 1
    FROM hubspot_lead_resolved
    WHERE email IS NULL
      OR (last_name IS NULL AND company_name_fallback IS NULL)
  ) THEN
    RAISE EXCEPTION
      'Every row needs E-Mail and at least one of Nachname or company-name fallback';
END IF;

  IF
EXISTS (
    SELECT 1
    FROM hubspot_lead_resolved
    WHERE score IS NOT NULL AND (score < 0 OR score > 100)
  ) THEN
    RAISE EXCEPTION 'score must be between 0 and 100';
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
                   external_guid,
                   created_at,
                   updated_at)
SELECT lead_id,
       first_name,
       last_name,
       company_name_fallback,
       email,
       NULL,
       website_url,
       category_id,
       score,
       'manual',
       lead_status,
       NULL,
       NULL,
       improvements,
       external_guid,
       created_at_value,
       created_at_value
FROM hubspot_lead_resolved;

INSERT INTO lead_social_profiles (id,
                                  lead_id,
                                  platform,
                                  profile_url,
                                  normalized_url,
                                  created_at,
                                  updated_at)
SELECT gen_random_uuid(),
       lead_id,
       'linkedin',
       linkedin_url,
       normalized_linkedin_url,
       created_at_value,
       created_at_value
FROM hubspot_lead_resolved
WHERE linkedin_url IS NOT NULL;

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
       created_at_value,
       'system',
       NULL,
       NULL,
       created_at_value
FROM hubspot_lead_resolved;

SELECT l.id,
       l.external_guid,
       l.email,
       l.first_name,
       l.last_name,
       l.company_name,
       l.lead_status,
       l.source,
       l.score,
       l.website_url,
       lc.slug      AS category_slug,
       lc.label_key AS category_label_key
FROM leads l
         LEFT JOIN lead_categories lc ON lc.id = l.category_id
WHERE l.external_guid IN (SELECT external_guid
                          FROM hubspot_lead_resolved
                          WHERE external_guid IS NOT NULL)
ORDER BY l.created_at DESC;

COMMIT;
