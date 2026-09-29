export const ProcessTrackItemKind = {
  Custom: "custom",
  FeedbackRound: "feedback_round",
} as const;

export type ProcessTrackItemKind =
  (typeof ProcessTrackItemKind)[keyof typeof ProcessTrackItemKind];
