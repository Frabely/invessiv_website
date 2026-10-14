/** Mirrors the `projects` columns: the form and the server schema bound the fields identically. */
export const ProjectFieldLimits = {
  TitleMaxLength: 160,
  ProcessStepMaxLength: 80,
  ProcessStepsMaxCount: 30,
  FeedbackRoundsMax: 20,
  DefaultFeedbackRoundCount: 2,
} as const;

export type ProjectFieldLimit =
  (typeof ProjectFieldLimits)[keyof typeof ProjectFieldLimits];
