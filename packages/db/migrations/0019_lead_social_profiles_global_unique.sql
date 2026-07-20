-- Replace the per-lead social profile uniqueness with a global uniqueness across all leads.
-- Prerequisite: run `pnpm --filter @invessiv/workspace leads:backfill-social-profile-urls <target>`
-- against this environment first so normalized_url reflects the hardened normalization
-- (https-only, lowercased host, no www.) before this constraint is added — otherwise
-- semantically identical profiles stored in the old format will not collide correctly
-- going forward. If duplicate (platform, normalized_url) pairs still exist across leads,
-- this statement fails atomically and nothing is changed.
DROP INDEX IF EXISTS lead_social_profiles_lead_platform_url_uidx;
--> statement-breakpoint
CREATE UNIQUE INDEX lead_social_profiles_platform_normalized_url_uidx
    ON lead_social_profiles (platform, normalized_url);
