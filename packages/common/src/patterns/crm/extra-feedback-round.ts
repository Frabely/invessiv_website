import { ExtraFeedbackRoundBlocker } from "../../constants/crm/extra-feedback-round-blockers";
import { FeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";
import { ProjectFieldLimits } from "../../constants/crm/forms/project-field-limits";
import { normalizeFeedbackRoundPositions } from "./feedback-round-positions";

/**
 * The one definition of "this project can take a further round". An approval is final, so it is
 * named before the limit: nothing the team changes about the track would lift it.
 */
export function findExtraFeedbackRoundBlocker(input: {
  positions: readonly number[];
  rounds: readonly { status: FeedbackRoundStatus }[];
}): ExtraFeedbackRoundBlocker | null {
  if (
    input.rounds.some((round) => round.status === FeedbackRoundStatus.Approved)
  )
    return ExtraFeedbackRoundBlocker.ProjectApproved;
  if (input.positions.length >= ProjectFieldLimits.FeedbackRoundsMax)
    return ExtraFeedbackRoundBlocker.LimitReached;
  return null;
}

/**
 * Where a further round goes: behind the last round, or behind the current step once the project
 * has moved past it. Either way it is the next round to hand over, and it never changes the place
 * of a round that was handed over before.
 */
export function nextExtraFeedbackRoundPosition(input: {
  processSteps: readonly string[];
  currentProcessStep: string;
  positions: readonly number[];
}): number {
  const lastPosition =
    normalizeFeedbackRoundPositions(
      input.positions,
      input.processSteps.length,
    ).at(-1) ?? 0;
  const behindCurrentStep =
    input.processSteps.indexOf(input.currentProcessStep) + 1;
  return Math.max(lastPosition, behindCurrentStep);
}
