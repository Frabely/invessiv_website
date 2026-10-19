/** The three texts of one clarification, each written by its own side. */
export const FeedbackClarificationPart = {
  Question: "question",
  Answer: "answer",
  Close: "close",
} as const;

export type FeedbackClarificationPart =
  (typeof FeedbackClarificationPart)[keyof typeof FeedbackClarificationPart];
