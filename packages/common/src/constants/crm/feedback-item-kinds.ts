export const FeedbackItemKind = {
  ChangeRequest: "change_request",
  Bug: "bug",
} as const;

export type FeedbackItemKind =
  (typeof FeedbackItemKind)[keyof typeof FeedbackItemKind];

export const FEEDBACK_ITEM_KIND_VALUES = [
  FeedbackItemKind.ChangeRequest,
  FeedbackItemKind.Bug,
] as const;
