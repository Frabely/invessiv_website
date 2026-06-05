export const LINKEDIN_POST_DELIVERY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const DeliveryTokenInvalidReason = {
  Malformed: "malformed",
  Expired: "expired",
} as const;

export type DeliveryTokenInvalidReason =
  (typeof DeliveryTokenInvalidReason)[keyof typeof DeliveryTokenInvalidReason];
