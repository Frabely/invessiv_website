-- Allow the new outreach states (connected, follow_up, not_reached, reminder) in existing databases.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_status_check;
--> statement-breakpoint
ALTER TABLE leads
    ADD CONSTRAINT leads_lead_status_check
        CHECK (lead_status IN
               ('new', 'pending_review', 'contacted', 'connected', 'follow_up', 'not_reached', 'reminder',
                'responded', 'qualified', 'proposal', 'on_hold', 'won', 'lost', 'archived'));
