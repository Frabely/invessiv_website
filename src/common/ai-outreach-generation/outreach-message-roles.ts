export const OutreachChatRole = {
  System: "system",
  User: "user",
  Assistant: "assistant",
} as const;

export type OutreachChatRole =
  (typeof OutreachChatRole)[keyof typeof OutreachChatRole];

export const OUTREACH_CHAT_ROLE_VALUES = [
  OutreachChatRole.System,
  OutreachChatRole.User,
  OutreachChatRole.Assistant,
] as const;
