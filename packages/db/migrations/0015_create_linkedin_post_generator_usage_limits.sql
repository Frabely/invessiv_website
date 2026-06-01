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
    and
    successful_generations
    <=
    2
),
    constraint linkedin_post_generator_usage_limits_hash_check
    check
(
    btrim
(
    key_hash
) <> '')
    );

create index if not exists linkedin_post_generator_usage_limits_reset_idx
    on linkedin_post_generator_usage_limits (window_reset_at);
