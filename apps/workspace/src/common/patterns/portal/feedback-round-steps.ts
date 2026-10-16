import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import { FeedbackRoundStepKind } from "@/common/constants/portal/feedback-round-step-kinds";
import type { FeedbackRoundStepEntry } from "@/common/contracts/portal/feedback-round-step-entry";

type FeedbackRoundSource = Pick<
  PortalProjectFeedbackDto,
  "activeRound" | "history" | "quota"
>;

/**
 * Every round of the quota in order, so the customer sees how many there are and which one runs.
 * A round past the quota (granted as an extra) still gets its step; rounds after an approval
 * expire instead of waiting.
 */
export function listFeedbackRoundSteps(
  feedback: FeedbackRoundSource,
): FeedbackRoundStepEntry[] {
  const rounds = new Map<number, PortalFeedbackRoundDto>();
  for (const round of feedback.history) rounds.set(round.roundNumber, round);
  if (feedback.activeRound)
    rounds.set(feedback.activeRound.roundNumber, feedback.activeRound);
  const last = Math.max(
    feedback.quota.included,
    feedback.quota.used,
    ...rounds.keys(),
  );
  const entries: FeedbackRoundStepEntry[] = [];
  for (let roundNumber = 1; roundNumber <= last; roundNumber += 1) {
    const round = rounds.get(roundNumber);
    if (round) {
      entries.push({ kind: FeedbackRoundStepKind.Round, roundNumber, round });
    } else {
      entries.push({
        kind:
          feedback.quota.approvedRoundNumber === null
            ? FeedbackRoundStepKind.Upcoming
            : FeedbackRoundStepKind.Expired,
        roundNumber,
        round: null,
      });
    }
  }
  return entries;
}

/** The round the page opens on: the running one, else the newest; null while none was handed over. */
export function initialFeedbackRoundNumber(
  feedback: FeedbackRoundSource,
): number | null {
  if (feedback.activeRound) return feedback.activeRound.roundNumber;
  return feedback.history.reduce<number | null>(
    (highest, round) =>
      highest === null || round.roundNumber > highest
        ? round.roundNumber
        : highest,
    null,
  );
}
