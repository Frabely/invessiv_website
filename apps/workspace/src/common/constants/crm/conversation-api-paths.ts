/** Path segments below a customer that CRM and portal conversation routes share. */
export const ConversationApiPath = {
  Conversation: "conversation",
  Messages: "messages",
  Read: "read",
  Owner: "owner",
} as const;

export type ConversationApiPath =
  (typeof ConversationApiPath)[keyof typeof ConversationApiPath];
