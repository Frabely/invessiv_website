/** Colour of a notice on the portal feedback page; each comes with its own icon and words. */
export const FeedbackNoticeTone = {
  /** The customer's turn or something running. */
  Info: "info",
  /** The team needs something from the customer: a call, an addition. */
  Warm: "warm",
  /** Done: implemented, approved. */
  Success: "success",
  /** Nothing to do yet. */
  Neutral: "neutral",
} as const;

export type FeedbackNoticeTone =
  (typeof FeedbackNoticeTone)[keyof typeof FeedbackNoticeTone];

export const FEEDBACK_NOTICE_TONE_VALUES = [
  FeedbackNoticeTone.Info,
  FeedbackNoticeTone.Warm,
  FeedbackNoticeTone.Success,
  FeedbackNoticeTone.Neutral,
] as const;
