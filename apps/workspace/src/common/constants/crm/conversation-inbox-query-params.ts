/** URL parameters of the inbox; they only carry ids and modes, never names. */
export const ConversationInboxQueryParam = {
  Customer: "customer",
  Filter: "filter",
} as const;
export type ConversationInboxQueryParam =
  (typeof ConversationInboxQueryParam)[keyof typeof ConversationInboxQueryParam];
