/** Path segments of the CRM and portal feedback round routes. */
export const FeedbackApiPath = {
  FeedbackRounds: "feedback-rounds",
  Feedback: "feedback",
  Draft: "draft",
  Submit: "submit",
  Approve: "approve",
  Items: "items",
  Files: "files",
  Status: "status",
  Result: "result",
  Read: "read",
} as const;

export type FeedbackApiPath =
  (typeof FeedbackApiPath)[keyof typeof FeedbackApiPath];
