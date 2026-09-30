/** Why a new area was not added to the list; the chip input explains it next to the field. */
export const FeedbackAreaRejection = {
  Empty: "empty",
  TooLong: "tooLong",
  Duplicate: "duplicate",
  LimitReached: "limitReached",
} as const;

export type FeedbackAreaRejection =
  (typeof FeedbackAreaRejection)[keyof typeof FeedbackAreaRejection];

export const FEEDBACK_AREA_REJECTION_VALUES = [
  FeedbackAreaRejection.Empty,
  FeedbackAreaRejection.TooLong,
  FeedbackAreaRejection.Duplicate,
  FeedbackAreaRejection.LimitReached,
] as const;
