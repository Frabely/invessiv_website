export const FeedbackResultHistoryEventKind = {
  Baseline: "baseline",
  Set: "set",
  Reset: "reset",
} as const;

export type FeedbackResultHistoryEventKind =
  (typeof FeedbackResultHistoryEventKind)[keyof typeof FeedbackResultHistoryEventKind];

export const FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES = [
  FeedbackResultHistoryEventKind.Baseline,
  FeedbackResultHistoryEventKind.Set,
  FeedbackResultHistoryEventKind.Reset,
] as const;
