-- Allow the new import/webform status in existing databases.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_status_check;
--> statement-breakpoint
ALTER TABLE leads
    ADD CONSTRAINT leads_lead_status_check
        CHECK (lead_status IN
               ('new', 'pending_review', 'contacted', 'qualified', 'proposal', 'on_hold', 'won', 'lost', 'archived'));
