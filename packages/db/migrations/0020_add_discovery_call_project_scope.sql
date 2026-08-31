-- The project scope is optional. If present, it must be one of the three
-- service models. There is deliberately no default.
ALTER TABLE lead_call_contacts
    ADD COLUMN IF NOT EXISTS project_scope TEXT;
--> statement-breakpoint
ALTER TABLE lead_call_contacts
DROP
CONSTRAINT IF EXISTS lead_call_contacts_project_scope_check;
--> statement-breakpoint
ALTER TABLE lead_call_contacts
    ADD CONSTRAINT lead_call_contacts_project_scope_check
        CHECK (
            project_scope IS NULL
                OR project_scope IN (
                                     'landing_page',
                                     'compact_website',
                                     'business_website'
                )
            );
