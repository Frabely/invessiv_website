/** Dictionary keys of system events; the text itself lives in each app's message dictionaries. */
export const SystemMessageKey = {
  ProjectPhaseChanged: "projectPhaseChanged",
  FeedbackRoundHandedOver: "feedbackRoundHandedOver",
  FeedbackRoundSubmitted: "feedbackRoundSubmitted",
  FeedbackRoundDiscussionRequested: "feedbackRoundDiscussionRequested",
  FeedbackRoundReturned: "feedbackRoundReturned",
  FeedbackRoundCompleted: "feedbackRoundCompleted",
  FeedbackApproved: "feedbackApproved",
  OnboardingSubmitted: "onboardingSubmitted",
  OnboardingReleased: "onboardingReleased",
  OnboardingChangesRequested: "onboardingChangesRequested",
  OnboardingCompleted: "onboardingCompleted",
  CustomerTaskRequested: "customerTaskRequested",
} as const;
export type SystemMessageKey =
  (typeof SystemMessageKey)[keyof typeof SystemMessageKey];
export const SYSTEM_MESSAGE_KEY_VALUES = [
  SystemMessageKey.ProjectPhaseChanged,
  SystemMessageKey.FeedbackRoundHandedOver,
  SystemMessageKey.FeedbackRoundSubmitted,
  SystemMessageKey.FeedbackRoundDiscussionRequested,
  SystemMessageKey.FeedbackRoundReturned,
  SystemMessageKey.FeedbackRoundCompleted,
  SystemMessageKey.FeedbackApproved,
  SystemMessageKey.OnboardingSubmitted,
  SystemMessageKey.OnboardingReleased,
  SystemMessageKey.OnboardingChangesRequested,
  SystemMessageKey.OnboardingCompleted,
  SystemMessageKey.CustomerTaskRequested,
] as const;

/** Parameter names stored in `messages.metadata` of a system event. */
export const SystemMessageParam = {
  ProjectTitle: "projectTitle",
  Phase: "phase",
  RoundNumber: "roundNumber",
  BlockTitles: "blockTitles",
  TaskTitle: "taskTitle",
} as const;
export type SystemMessageParam =
  (typeof SystemMessageParam)[keyof typeof SystemMessageParam];
