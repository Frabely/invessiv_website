import "server-only";

import { eq } from "drizzle-orm";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { ApprovePortalFeedbackRequestDto } from "@invessiv/common/contracts/portal/approve-portal-feedback-request.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import { isActiveFeedbackRound } from "@invessiv/common/patterns/crm/feedback-round-state";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { feedbackRounds, projects } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { feedbackRoundWriteService } from "@/server/shared/services/feedback/feedback-round-write-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";

type Result = PortalFeedbackResult<PortalFeedbackRoundDto>;

/** "Approve without changes" is only for a round the customer left empty. */
async function rejectUnlessEmpty(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
): Promise<Result | null> {
  const items = await portalFeedbackService.listItemHeads(tx, round.id);
  return items.length > 0
    ? { ok: false, code: PortalFeedbackErrorCode.ItemsPresent }
    : null;
}

/**
 * A completed round may be approved only while it is the project's latest one and nothing runs.
 * The project lock is the one the handover takes: a parallel handover of the next round either
 * finishes first and is seen here, or waits and then sees the approval.
 */
async function rejectUnlessLatest(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
): Promise<Result | null> {
  await tx
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, round.project_id))
    .for("update");
  const rounds = await tx
    .select({
      roundNumber: feedbackRounds.round_number,
      status: feedbackRounds.status,
    })
    .from(feedbackRounds)
    .where(eq(feedbackRounds.project_id, round.project_id));
  if (rounds.some(({ status }) => isActiveFeedbackRound(status)))
    return { ok: false, code: PortalFeedbackErrorCode.Locked };
  return rounds.some(({ roundNumber }) => roundNumber > round.round_number)
    ? { ok: false, code: PortalFeedbackErrorCode.NotLatest }
    : null;
}

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
  if (input.confirmFinal !== true)
    return { ok: false, code: PortalFeedbackErrorCode.ConfirmationRequired };
  return round.status === FeedbackRoundStatus.Open
    ? rejectUnlessEmpty(tx, round)
    : rejectUnlessLatest(tx, round);
}

/**
 * The customer's final approval, only after the explicit confirmation: either "without changes"
 * from an empty open round, or after the latest completed round. The track moves behind the round
 * in the same transaction; a second approval is refused by the transition table and the index.
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
