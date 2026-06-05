ALTER TABLE lead_submissions
DROP
CONSTRAINT IF EXISTS lead_submissions_channel_check;
--> statement-breakpoint
ALTER TABLE lead_submissions
    ADD CONSTRAINT lead_submissions_channel_check
        CHECK (channel IN ('project_request', 'quick_contact', 'discovery_call', 'linkedin_post_delivery'));
--> statement-breakpoint
