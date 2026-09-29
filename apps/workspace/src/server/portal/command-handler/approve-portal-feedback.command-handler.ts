import "server-only";

import { eq } from "drizzle-orm";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { ApprovePortalFeedbackRequestDto } from "@invessiv/common/contracts/portal/approve-portal-feedback-request.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { feedbackRoundItems } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { announceFeedbackRound } from "@/server/shared/services/feedback/announce-feedback-round";
import { feedbackProjectStepService } from "@/server/shared/services/feedback/feedback-project-step-service";
import { feedbackRoundActivityService } from "@/server/shared/services/feedback/feedback-round-activity-service";

type Result = PortalFeedbackResult<PortalFeedbackRoundDto>;

async function hasItems(
  tx: ContactDatabaseTransaction,
  roundId: string,
): Promise<boolean> {
  const [item] = await tx
    .select({ id: feedbackRoundItems.id })
    .from(feedbackRoundItems)
    .where(eq(feedbackRoundItems.round_id, roundId))
    .limit(1);
  return !!item;
}

/**
 * "Approve without changes": only from an open round without items, and only after the explicit
 * confirmation. The track moves behind the round in the same transaction; the approval after a
 * completed round follows in Task 61.
 */
export async function approvePortalFeedback(
  actor: PortalActor,
  roundId: string,
  input: ApprovePortalFeedbackRequestDto,
): Promise<Result> {
  const parsed = portalFeedbackSchemas.approve.safeParse(input);
  if (!parsed.success)
    return { ok: false, code: PortalFeedbackErrorCode.Validation };
  if (parsed.data.confirmFinal !== true)
    return { ok: false, code: PortalFeedbackErrorCode.ConfirmationRequired };

  return getDrizzleDatabaseClient().transaction(async (tx): Promise<Result> => {
    const locked = await portalFeedbackService.lockRound(tx, actor, roundId);
    if (!locked) return { ok: false, code: PortalFeedbackErrorCode.NotFound };
    const { round, projectTitle } = locked;
    const rejected = await portalFeedbackService.rejectUnlessOpen(
      tx,
      actor,
      round,
      parsed.data.version,
    );
    if (rejected) return rejected;
    if (await hasItems(tx, round.id))
      return { ok: false, code: PortalFeedbackErrorCode.ItemsPresent };

    const approved = await portalFeedbackService.writeRound(tx, round, {
      status: FeedbackRoundStatus.Approved,
      approved_at: new Date(),
      approved_by_portal_membership_id: actor.membershipId,
    });
    await feedbackProjectStepService.advancePastFeedbackRound(
      tx,
      approved.project_id,
      approved.round_number,
    );
    await feedbackRoundActivityService.recordStatusChange(
      tx,
      approved,
      portalFeedbackService.activityActor(actor),
      { previous: round.status, next: approved.status },
    );
    await announceFeedbackRound(
      tx,
      approved,
      projectTitle,
      SystemMessageKey.FeedbackApproved,
    );
    return {
      ok: true,
      value: await portalFeedbackService.toRoundDto(tx, actor, approved),
    };
  });
}
