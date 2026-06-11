create table if not exists linkedin_post_generator_usage_limits
(
    key_hash
    text
    primary
    key,
    successful_generations
    integer
    not
    null
    default
    0,
    window_started_at
    timestamptz
    not
    null,
    window_reset_at
    timestamptz
    not
    null,
    created_at
    timestamptz
    not
    null
    default
    now
(
),
    updated_at timestamptz not null default now
(
),
    constraint linkedin_post_generator_usage_limits_count_check
    check
(
    successful_generations
    >=
    0
),
    constraint linkedin_post_generator_usage_limits_hash_check
    check
(
    btrim
(
    key_hash
) <> '')
    );

--> statement-breakpoint

create index if not exists linkedin_post_generator_usage_limits_reset_idx
    on linkedin_post_generator_usage_limits (window_reset_at);

--> statement-breakpoint

ALTER TABLE lead_submissions
    ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'website';

--> statement-breakpoint

ALTER TABLE lead_submissions
    ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS lead_submissions_origin_created_at_idx
    ON lead_submissions (origin, created_at DESC);
