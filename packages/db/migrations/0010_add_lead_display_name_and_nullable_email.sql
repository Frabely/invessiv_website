-- Backfill display_name for existing leads before enforcing NOT NULL.
DO
$$
BEGIN
  IF
EXISTS (
    SELECT 1
    FROM leads
    WHERE company_name IS NOT NULL AND BTRIM(company_name) <> ''
    GROUP BY lower(BTRIM(company_name))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create leads_company_name_lower_uidx: duplicate normalized company_name values exist';
END IF;
END $$;
--> statement-breakpoint
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS display_name TEXT;
--> statement-breakpoint
UPDATE leads
SET display_name = COALESCE(
        NULLIF(BTRIM(company_name), ''),
        NULLIF(BTRIM(first_name), '') || CASE
                                             WHEN NULLIF(BTRIM(first_name), '') IS NOT NULL
                                                 AND NULLIF(BTRIM(last_name), '') IS NOT NULL THEN ' '
                                             ELSE ''
            END || COALESCE(NULLIF(BTRIM(last_name), ''), ''),
        NULLIF(BTRIM(last_name), '')
                   )
WHERE display_name IS NULL
   OR BTRIM(display_name) = '';
--> statement-breakpoint
ALTER TABLE leads
    ALTER COLUMN display_name SET NOT NULL;
--> statement-breakpoint
ALTER TABLE leads
    ALTER COLUMN email DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE leads
DROP
CONSTRAINT IF EXISTS leads_last_name_or_company_name_check;
--> statement-breakpoint
DROP INDEX IF EXISTS leads_email_lower_uidx;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_lower_uidx
    ON leads (lower (BTRIM(email)))
    WHERE email IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS leads_company_name_lower_uidx
    ON leads (lower (BTRIM(company_name)))
    WHERE company_name IS NOT NULL;
