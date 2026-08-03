CREATE TABLE IF NOT EXISTS lead_outreach_drafts
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    lead_id UUID NOT NULL REFERENCES leads
(
    id
) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK
(
    channel
    IN
(
    'instagram',
    'linkedin'
)),
    audience TEXT NOT NULL CHECK
(
    audience
    IN
(
    'single',
    'team'
)),
    salutation_name TEXT NOT NULL,
    icebreaker TEXT NOT NULL,
    body TEXT NOT NULL,
    char_count INTEGER NOT NULL,
    model TEXT,
    profile_source TEXT NOT NULL CHECK
(
    profile_source
    IN
(
    'bridge_api',
    'bridge_dom',
    'manual_paste'
)),
    profile_captured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_outreach_drafts_lead_id_channel_created_at_idx
    ON lead_outreach_drafts (lead_id, channel, created_at DESC);
