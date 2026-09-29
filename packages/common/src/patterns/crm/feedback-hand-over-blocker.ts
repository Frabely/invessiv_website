import { FeedbackHandOverBlocker } from "../../constants/crm/feedback-hand-over-blockers";
import { FeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";
import { FeedbackTransitionSide } from "../../constants/crm/feedback-transition-sides";
import {
  ProjectStatus,
  type ProjectStatus as ProjectStatusValue,
} from "../../constants/crm/project-statuses";
import {
  canTransition,
  feedbackQuota,
  feedbackRoundStepPosition,
  isAtFeedbackStep,
} from "./feedback-round-state";

type HandOverInput = {
  projectStatus: ProjectStatusValue;
  processSteps: readonly string[];
  currentProcessStep: string;
  /** `null` for projects created before round steps existed; they have no round to hand over. */
  feedbackRoundPositions: readonly number[] | null;
  includedFeedbackRounds: number;
  rounds: readonly { roundNumber: number; status: FeedbackRoundStatus }[];
};

/**
 * The one definition of "round n + 1 may be handed over now". The handover command answers with
 * the returned code, the round list shows it as the reason the button is disabled. The handover
 * itself must be a step of `FEEDBACK_ROUND_TRANSITIONS` like every other one. Checks run from
 * the coarsest to the finest, so the reason names what has to change first.
 */
export function findFeedbackHandOverBlocker(
  input: HandOverInput,
): FeedbackHandOverBlocker | null {
  if (
    input.projectStatus !== ProjectStatus.Active ||
    !canTransition(
      null,
      FeedbackRoundStatus.Open,
      FeedbackTransitionSide.Internal,
    )
  )
    return FeedbackHandOverBlocker.ProjectNotEligible;
  const quota = feedbackQuota({
    included: input.includedFeedbackRounds,
    rounds: input.rounds,
  });
  if (quota.approvedRoundNumber !== null)
    return FeedbackHandOverBlocker.ProjectAlreadyApproved;
  if (quota.activeRoundNumber !== null)
    return FeedbackHandOverBlocker.RoundAlreadyActive;
  const roundNumber = quota.used + 1;
  if (roundNumber > quota.included)
    return FeedbackHandOverBlocker.QuotaExhausted;
  const positions = input.feedbackRoundPositions ?? [];
  if (
    feedbackRoundStepPosition(
      positions,
      input.processSteps.length,
      roundNumber,
    ) === null
  )
    return FeedbackHandOverBlocker.RoundStepMissing;
  if (
    !isAtFeedbackStep({
      processSteps: input.processSteps,
      currentProcessStep: input.currentProcessStep,
      feedbackRoundPositions: positions,
      roundNumber,
    })
  )
    return FeedbackHandOverBlocker.ProjectNotAtFeedbackStep;
  return null;
}
