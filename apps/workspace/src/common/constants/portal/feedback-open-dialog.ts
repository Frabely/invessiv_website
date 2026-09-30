export const FeedbackOpenDialog = {
  Submit: "submit",
  Approve: "approve",
} as const;

export type FeedbackOpenDialog =
  (typeof FeedbackOpenDialog)[keyof typeof FeedbackOpenDialog];
