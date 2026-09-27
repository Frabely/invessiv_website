export const ConversationInboxFilter = {
  All: "all",
  Mine: "mine",
} as const;
export type ConversationInboxFilter =
  (typeof ConversationInboxFilter)[keyof typeof ConversationInboxFilter];
export const CONVERSATION_INBOX_FILTER_VALUES = [
  ConversationInboxFilter.All,
  ConversationInboxFilter.Mine,
] as const;
