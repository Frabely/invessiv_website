-- Allow the new "responded" status (lead has replied to outreach) in existing databases.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_status_check;
--> statement-breakpoint
ALTER TABLE leads
    ADD CONSTRAINT leads_lead_status_check
        CHECK (lead_status IN
               ('new', 'pending_review', 'contacted', 'responded', 'qualified', 'proposal', 'on_hold', 'won', 'lost', 'archived'));
