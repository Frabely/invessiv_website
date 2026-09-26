export const PendingMessageStatus = {
  Sending: "sending",
  Failed: "failed",
} as const;

export type PendingMessageStatus =
  (typeof PendingMessageStatus)[keyof typeof PendingMessageStatus];
