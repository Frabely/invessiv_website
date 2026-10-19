/** Why an answer to a question was not sent; the portal words each one itself. */
export const FeedbackAnswerProblem = {
  Required: "required",
  TooLong: "tooLong",
  Conflict: "conflict",
  NotOpen: "notOpen",
  Failure: "failure",
} as const;

export type FeedbackAnswerProblem =
  (typeof FeedbackAnswerProblem)[keyof typeof FeedbackAnswerProblem];
