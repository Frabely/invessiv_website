-- Allow the new call pipeline stages (setting_call, closing_call) in existing databases.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_status_check;
--> statement-breakpoint
ALTER TABLE leads
    ADD CONSTRAINT leads_lead_status_check
        CHECK (lead_status IN
               ('new', 'pending_review', 'contacted', 'connection_requested', 'connected', 'follow_up', 'not_reached',
                'reminder', 'responded', 'setting_call', 'closing_call', 'qualified', 'proposal', 'on_hold', 'won',
                'lost', 'archived'));
--> statement-breakpoint
-- Add professional service lead categories (lawyers, tax advisors, appraisers) before the "other" catch-all.
INSERT INTO lead_categories (id, slug, label_key, sort_order)
VALUES (gen_random_uuid(), 'lawyers', 'lawyers', 62),
       (gen_random_uuid(), 'tax-advisors', 'tax-advisors', 64),
       (gen_random_uuid(), 'appraisers', 'appraisers', 66) ON CONFLICT (slug) DO NOTHING;
