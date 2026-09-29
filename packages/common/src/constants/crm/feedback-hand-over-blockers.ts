import { FeedbackRoundErrorCode } from "./errors/feedback-round-error-codes";

/** Reasons why the next round cannot be handed over; each one is also the handover's error code. */
export const FeedbackHandOverBlocker = {
  ProjectNotEligible: FeedbackRoundErrorCode.ProjectNotEligible,
  ProjectAlreadyApproved: FeedbackRoundErrorCode.ProjectAlreadyApproved,
  RoundAlreadyActive: FeedbackRoundErrorCode.RoundAlreadyActive,
  QuotaExhausted: FeedbackRoundErrorCode.QuotaExhausted,
  RoundStepMissing: FeedbackRoundErrorCode.RoundStepMissing,
  ProjectNotAtFeedbackStep: FeedbackRoundErrorCode.ProjectNotAtFeedbackStep,
} as const;

export type FeedbackHandOverBlocker =
  (typeof FeedbackHandOverBlocker)[keyof typeof FeedbackHandOverBlocker];

export const FEEDBACK_HAND_OVER_BLOCKER_VALUES = [
  FeedbackHandOverBlocker.ProjectNotEligible,
  FeedbackHandOverBlocker.ProjectAlreadyApproved,
  FeedbackHandOverBlocker.RoundAlreadyActive,
  FeedbackHandOverBlocker.QuotaExhausted,
  FeedbackHandOverBlocker.RoundStepMissing,
  FeedbackHandOverBlocker.ProjectNotAtFeedbackStep,
] as const;
