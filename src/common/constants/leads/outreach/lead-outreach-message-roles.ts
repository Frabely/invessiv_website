export const OutreachChatRole = {
  System: "system",
  User: "user",
  Assistant: "assistant",
} as const;

export type OutreachChatRole =
  (typeof OutreachChatRole)[keyof typeof OutreachChatRole];
