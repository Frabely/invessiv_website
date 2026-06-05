export const LINKEDIN_POST_GENERATOR_USAGE_LIMIT_SCOPE =
  "linkedin-post-generator";

export const LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX = 2;

export const LINKEDIN_POST_GENERATOR_USAGE_LIMIT_WINDOW_MS =
  30 * 24 * 60 * 60 * 1000;

/**
 * Anti-abuse rate-limit for the signed deliver step (post per E-Mail schicken).
 * Kept on a separate scope so it never touches the generation counter. The
 * cap is generous on purpose: a visitor can generate at most two posts per
 * window, and each delivery is already gated behind a signed token (the server
 * re-renders only the exact, signed post), so the limit only guards against
 * blasting the same generated post to many addresses — not against arbitrary
 * sends. Headroom covers legitimate retries/resends.
 */
export const LINKEDIN_POST_DELIVERY_USAGE_LIMIT_SCOPE =
  "linkedin-post-delivery";

export const LINKEDIN_POST_DELIVERY_USAGE_LIMIT_MAX = 10;

export const LINKEDIN_POST_DELIVERY_USAGE_LIMIT_WINDOW_MS =
  30 * 24 * 60 * 60 * 1000;
