/** URL parameters of the portal feedback page. */
export const PortalFeedbackQueryParam = {
  /** Number of the round shown; an unknown or upcoming round falls back to the current one. */
  Round: "round",
} as const;

export type PortalFeedbackQueryParam =
  (typeof PortalFeedbackQueryParam)[keyof typeof PortalFeedbackQueryParam];
