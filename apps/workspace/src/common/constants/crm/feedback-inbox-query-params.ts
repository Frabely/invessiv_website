/** URL parameters of the feedback inbox; they only carry ids and modes, never names. */
export const FeedbackInboxQueryParam = {
  Status: "status",
  Unread: "unread",
  Customer: "customer",
} as const;
export type FeedbackInboxQueryParam =
  (typeof FeedbackInboxQueryParam)[keyof typeof FeedbackInboxQueryParam];

/** The only value that turns the unread filter on; anything else leaves it off. */
export const FEEDBACK_INBOX_UNREAD_ONLY = "1";
