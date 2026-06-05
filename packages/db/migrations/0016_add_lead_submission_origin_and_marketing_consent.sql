-- Extend lead submissions with origin and optional marketing consent.
-- Relax the generator usage counter so the same table can also be used for
-- delivery usage with its own scope in key_hash.
ALTER TABLE lead_submissions
    ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'website';
--> statement-breakpoint
ALTER TABLE lead_submissions
    ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_submissions_origin_created_at_idx
    ON lead_submissions (origin, created_at DESC);
--> statement-breakpoint
ALTER TABLE linkedin_post_generator_usage_limits
DROP
CONSTRAINT IF EXISTS linkedin_post_generator_usage_limits_count_check;
--> statement-breakpoint
ALTER TABLE linkedin_post_generator_usage_limits
    ADD CONSTRAINT linkedin_post_generator_usage_limits_count_check
        CHECK (successful_generations >= 0);
