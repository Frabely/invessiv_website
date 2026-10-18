/** Feedback of a copy button that copies a value it already holds, e.g. a login name. */
export const CopyFeedbackStatus = {
  Idle: "idle",
  Copied: "copied",
  Failed: "failed",
} as const;

export type CopyFeedbackStatus =
  (typeof CopyFeedbackStatus)[keyof typeof CopyFeedbackStatus];
