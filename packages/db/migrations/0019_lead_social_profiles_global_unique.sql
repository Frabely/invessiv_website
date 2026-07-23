-- Replace the per-lead social profile uniqueness with a global uniqueness across all leads.
-- Existing environments must have normalized_url values recomputed with the hardened
-- normalization (https-only, lowercased host, no www.) before this index is built.
--
-- Ordering: the new global index is created BEFORE the old per-lead index is dropped.
-- The migration runner executes each statement in its own autocommit step (there is no
-- surrounding transaction), so if the CREATE fails — e.g. an unexpected cross-lead
-- duplicate (platform, normalized_url) still exists — the DROP never runs and the old
-- per-lead uniqueness guard remains in place. `IF NOT EXISTS` / `IF EXISTS` keep the
-- migration idempotent on re-run.
CREATE UNIQUE INDEX IF NOT EXISTS lead_social_profiles_platform_normalized_url_uidx
    ON lead_social_profiles (platform, normalized_url);
--> statement-breakpoint
DROP INDEX IF EXISTS lead_social_profiles_lead_platform_url_uidx;
