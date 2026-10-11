/** Why a project cannot take a further feedback round. */
export const ExtraFeedbackRoundBlocker = {
  ProjectApproved: "project_approved",
  LimitReached: "limit_reached",
} as const;

export type ExtraFeedbackRoundBlocker =
  (typeof ExtraFeedbackRoundBlocker)[keyof typeof ExtraFeedbackRoundBlocker];

export const EXTRA_FEEDBACK_ROUND_BLOCKER_VALUES = [
  ExtraFeedbackRoundBlocker.ProjectApproved,
  ExtraFeedbackRoundBlocker.LimitReached,
] as const;
