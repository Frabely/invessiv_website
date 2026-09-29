import {
  ACTIVE_FEEDBACK_ROUND_STATUS_VALUES,
  FeedbackRoundStatus,
} from "../../constants/crm/feedback-round-statuses";
import { FEEDBACK_ROUND_TRANSITIONS } from "../../constants/crm/feedback-round-transitions";
import type { FeedbackTransitionSide } from "../../constants/crm/feedback-transition-sides";
import type { FeedbackQuotaDto } from "../../contracts/crm/feedback-quota.dto";
import { normalizeFeedbackRoundPositions } from "./feedback-round-positions";

/** `from: null` asks whether a new round may be handed over. */
export function canTransition(
  from: FeedbackRoundStatus | null,
  to: FeedbackRoundStatus,
  side: FeedbackTransitionSide,
): boolean {
  return FEEDBACK_ROUND_TRANSITIONS.some(
    (transition) =>
      transition.from === from &&
      transition.to === to &&
      transition.side === side,
  );
}

export function isActiveFeedbackRound(status: FeedbackRoundStatus): boolean {
  return (ACTIVE_FEEDBACK_ROUND_STATUS_VALUES as readonly string[]).includes(
    status,
  );
}

/** Round numbers are gapless, so the highest one is the number of rounds handed over. */
export function feedbackQuota({
  included,
  rounds,
}: {
  included: number;
  rounds: readonly { roundNumber: number; status: FeedbackRoundStatus }[];
}): FeedbackQuotaDto {
  const used = rounds.reduce(
    (highest, round) => Math.max(highest, round.roundNumber),
    0,
  );
  const approved = rounds.find(
    (round) => round.status === FeedbackRoundStatus.Approved,
  );
  const active = rounds.find((round) => isActiveFeedbackRound(round.status));
  return {
    included,
    used,
    remaining: approved ? 0 : Math.max(included - used, 0),
    activeRoundNumber: active?.roundNumber ?? null,
    approvedRoundNumber: approved?.roundNumber ?? null,
  };
}

/** Index into the steps before which round `roundNumber` sits; null when the track has no such round. */
export function feedbackRoundStepPosition(
  feedbackRoundPositions: readonly number[],
  stepCount: number,
  roundNumber: number,
): number | null {
  if (!Number.isInteger(roundNumber) || roundNumber < 1) return null;
  return (
    normalizeFeedbackRoundPositions(feedbackRoundPositions, stepCount)[
      roundNumber - 1
    ] ?? null
  );
}

/**
 * The project is ready for round n when the current step is the last free-text step before that
 * round; a round in front of every step counts from the first step. Steps are compared by label,
 * the same way `current_process_step` stores them.
 */
export function isAtFeedbackStep({
  processSteps,
  currentProcessStep,
  feedbackRoundPositions,
  roundNumber,
}: {
  processSteps: readonly string[];
  currentProcessStep: string;
  feedbackRoundPositions: readonly number[];
  roundNumber: number;
}): boolean {
  const position = feedbackRoundStepPosition(
    feedbackRoundPositions,
    processSteps.length,
    roundNumber,
  );
  if (position === null || processSteps.length === 0) return false;
  return processSteps[Math.max(position - 1, 0)] === currentProcessStep;
}
