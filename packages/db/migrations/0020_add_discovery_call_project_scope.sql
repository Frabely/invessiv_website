-- Existing call records predate the service selection. Backfill them once
-- explicitly, then require every future submission to provide a value.
-- There is deliberately no database default for project_scope.
ALTER TABLE lead_call_contacts
    ADD COLUMN IF NOT EXISTS project_scope TEXT;
--> statement-breakpoint
UPDATE lead_call_contacts
SET project_scope = 'unsure'
WHERE project_scope IS NULL;
--> statement-breakpoint
ALTER TABLE lead_call_contacts
    ALTER COLUMN project_scope SET NOT NULL;
--> statement-breakpoint
ALTER TABLE lead_call_contacts
DROP
CONSTRAINT IF EXISTS lead_call_contacts_project_scope_check;
--> statement-breakpoint
ALTER TABLE lead_call_contacts
    ADD CONSTRAINT lead_call_contacts_project_scope_check
        CHECK (project_scope IN (
                                 'unsure',
                                 'landing_page',
                                 'compact_website',
                                 'business_website'
            ));
