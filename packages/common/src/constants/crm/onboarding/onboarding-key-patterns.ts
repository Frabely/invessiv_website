/**
 * Internal keys of blocks and fields (`company_profile`). Stored as regex sources because the
 * database CHECK and the request validation use the same text.
 */
export const ONBOARDING_KEY_PATTERN_SOURCE = "^[a-z][a-z0-9_]{1,62}$";

/** Choice keys may be a single letter; `yes`/`no` and `low`/`high` are fixed keys of their types. */
export const ONBOARDING_CHOICE_KEY_PATTERN_SOURCE = "^[a-z][a-z0-9_]{0,62}$";
