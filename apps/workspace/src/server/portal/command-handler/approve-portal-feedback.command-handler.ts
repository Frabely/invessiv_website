import "server-only";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { ApprovePortalFeedbackRequestDto } from "@invessiv/common/contracts/portal/approve-portal-feedback-request.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { feedbackRoundWriteService } from "@/server/shared/services/feedback/feedback-round-write-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";

type Result = PortalFeedbackResult<PortalFeedbackRoundDto>;

/**
 * The transition table allows `completed → approved` as well; that path needs the latest-round
 * check and follows in Task 61. Until then only "approve without changes" from `open` is served.
 */
async function rejectUnlessApprovable(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  round: FeedbackRoundRow,
  input: { version: number; confirmFinal?: boolean },
): Promise<Result | null> {
  const rejected = await portalFeedbackService.rejectUnlessAllowed(
    tx,
    actor,
    round,
    FeedbackRoundStatus.Approved,
    input.version,
  );
  if (rejected) return rejected;
  if (round.status !== FeedbackRoundStatus.Open)
    return { ok: false, code: PortalFeedbackErrorCode.Locked };
  if (input.confirmFinal !== true)
    return { ok: false, code: PortalFeedbackErrorCode.ConfirmationRequired };
  const items = await portalFeedbackService.listItemHeads(tx, round.id);
  return items.length > 0
    ? { ok: false, code: PortalFeedbackErrorCode.ItemsPresent }
    : null;
}

/**
 * "Approve without changes": only from an open round without items, and only after the explicit
 * confirmation. The track moves behind the round in the same transaction.
 */
export async function approvePortalFeedback(
  actor: PortalActor,
  roundId: string,
  input: ApprovePortalFeedbackRequestDto,
): Promise<Result> {
  const parsed = portalFeedbackSchemas.approve.safeParse(input);
  if (!parsed.success)
    return { ok: false, code: PortalFeedbackErrorCode.Validation };

  return portalFeedbackService.withLockedRound(
    actor,
    roundId,
    async (tx, { round, projectTitle }) => {
      const rejected = await rejectUnlessApprovable(
        tx,
        actor,
        round,
        parsed.data,
      );
      if (rejected) return rejected;
      const approved = await feedbackRoundWriteService.approve(tx, round, {
        actor: portalActivityActor(actor),
        portalMembershipId: actor.membershipId,
        projectTitle,
      });
      return {
        ok: true,
        value: await portalFeedbackService.toRoundDto(tx, actor, approved),
      };
    },
  );
}
