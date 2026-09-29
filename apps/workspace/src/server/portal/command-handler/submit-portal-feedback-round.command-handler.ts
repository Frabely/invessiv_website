import "server-only";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { SubmitPortalFeedbackRoundRequestDto } from "@invessiv/common/contracts/portal/submit-portal-feedback-round-request.dto";
import type { SubmitPortalFeedbackRoundResponseDto } from "@invessiv/common/contracts/portal/submit-portal-feedback-round-response.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { feedbackRoundWriteService } from "@/server/shared/services/feedback/feedback-round-write-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";

type Result = PortalFeedbackResult<SubmitPortalFeedbackRoundResponseDto>;

/** Submitting needs at least one item, and every item needs text; the ids point the UI at the gaps. */
async function rejectIncompleteDraft(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
): Promise<Result | null> {
  const items = await portalFeedbackService.listItemHeads(tx, round.id);
  if (items.length === 0)
    return { ok: false, code: PortalFeedbackErrorCode.ItemsRequired };
  const itemIds = items
    .filter((item) => item.body.trim() === "")
    .map((item) => item.id);
  return itemIds.length > 0
    ? { ok: false, code: PortalFeedbackErrorCode.ItemTextRequired, itemIds }
    : null;
}

/**
 * A retry or double click by the contact who just submitted is a success and creates nothing twice.
 * Once the team moved the round on, a stale tab gets `locked` like everyone else.
 */
async function answerRepeatedSubmission(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  round: FeedbackRoundRow,
): Promise<Result | null> {
  if (
    round.status !== FeedbackRoundStatus.Submitted ||
    round.submitted_by_portal_membership_id !== actor.membershipId
  )
    return null;
  return {
    ok: true,
    value: {
      alreadySubmitted: true,
      round: await portalFeedbackService.toRoundDto(tx, actor, round),
    },
  };
}

/**
 * Locks the round for the customer and hands it to the team: the collecting task opens in the same
 * transaction, the chat notice runs in a savepoint and never blocks the submission.
 */
export async function submitPortalFeedbackRound(
  actor: PortalActor,
  roundId: string,
  input: SubmitPortalFeedbackRoundRequestDto,
): Promise<Result> {
  const parsed = portalFeedbackSchemas.submit.safeParse(input);
  if (!parsed.success)
    return { ok: false, code: PortalFeedbackErrorCode.Validation };

  return portalFeedbackService.withLockedRound(
    actor,
    roundId,
    async (tx, { round, projectTitle }) => {
      const rejected =
        (await answerRepeatedSubmission(tx, actor, round)) ??
        (await portalFeedbackService.rejectUnlessAllowed(
          tx,
          actor,
          round,
          FeedbackRoundStatus.Submitted,
          parsed.data.version,
        )) ??
        (await rejectIncompleteDraft(tx, round));
      if (rejected) return rejected;

      const submitted = await feedbackRoundWriteService.submit(tx, round, {
        actor: portalActivityActor(actor),
        portalMembershipId: actor.membershipId,
        projectTitle,
      });
      return {
        ok: true,
        value: {
          alreadySubmitted: false,
          round: await portalFeedbackService.toRoundDto(tx, actor, submitted),
        },
      };
    },
  );
}
