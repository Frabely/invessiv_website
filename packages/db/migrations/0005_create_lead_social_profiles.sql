CREATE TABLE IF NOT EXISTS lead_social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'youtube')),
  profile_url TEXT NOT NULL CHECK (BTRIM(profile_url) <> ''),
  normalized_url TEXT NOT NULL CHECK (BTRIM(normalized_url) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_social_profiles_lead_id_idx
  ON lead_social_profiles (lead_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS lead_social_profiles_lead_platform_url_uidx
  ON lead_social_profiles (lead_id, platform, normalized_url);
