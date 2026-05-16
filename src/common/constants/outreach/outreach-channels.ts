export const OutreachChannel = {
  Linkedin: "linkedin",
  Email: "email",
  Instagram: "instagram",
  DirectMessage: "direct-message",
} as const;

export type OutreachChannel =
  (typeof OutreachChannel)[keyof typeof OutreachChannel];

export const OUTREACH_CHANNEL_VALUES = [
  OutreachChannel.Linkedin,
  OutreachChannel.Email,
  OutreachChannel.Instagram,
  OutreachChannel.DirectMessage,
] as const;
