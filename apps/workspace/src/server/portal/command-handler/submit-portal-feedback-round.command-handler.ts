import "server-only";

import { asc, eq } from "drizzle-orm";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { SubmitPortalFeedbackRoundRequestDto } from "@invessiv/common/contracts/portal/submit-portal-feedback-round-request.dto";
import type { SubmitPortalFeedbackRoundResponseDto } from "@invessiv/common/contracts/portal/submit-portal-feedback-round-response.dto";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { feedbackRoundItems } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { announceFeedbackRound } from "@/server/shared/services/feedback/announce-feedback-round";
import { feedbackRoundActivityService } from "@/server/shared/services/feedback/feedback-round-activity-service";
import { feedbackRoundTaskService } from "@/server/shared/services/feedback/feedback-round-task-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";

type Result = PortalFeedbackResult<SubmitPortalFeedbackRoundResponseDto>;

/** Submitting needs at least one item, and every item needs text; the ids point the UI at the gaps. */
async function rejectIncompleteDraft(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
): Promise<Result | null> {
  const items = await tx
    .select({ id: feedbackRoundItems.id, body: feedbackRoundItems.body })
    .from(feedbackRoundItems)
    .where(eq(feedbackRoundItems.round_id, round.id))
    .orderBy(asc(feedbackRoundItems.position));
  if (items.length === 0)
    return { ok: false, code: PortalFeedbackErrorCode.ItemsRequired };
  const itemIds = items
    .filter((item) => item.body.trim() === "")
    .map((item) => item.id);
  return itemIds.length > 0
    ? { ok: false, code: PortalFeedbackErrorCode.ItemTextRequired, itemIds }
    : null;
}

/** A retry or double click by the contact who submitted is a success and creates nothing twice. */
async function answerRepeatedSubmission(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  round: FeedbackRoundRow,
): Promise<Result | null> {
  if (
    round.status === FeedbackRoundStatus.Open ||
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

  return getDrizzleDatabaseClient().transaction(async (tx): Promise<Result> => {
    const locked = await portalFeedbackService.lockRound(tx, actor, roundId);
    if (!locked) return { ok: false, code: PortalFeedbackErrorCode.NotFound };
    const { round, projectTitle } = locked;
    const rejected =
      (await answerRepeatedSubmission(tx, actor, round)) ??
      (await portalFeedbackService.rejectUnlessOpen(
        tx,
        actor,
        round,
        parsed.data.version,
      )) ??
      (await rejectIncompleteDraft(tx, round));
    if (rejected) return rejected;

    const submitted = await portalFeedbackService.writeRound(tx, round, {
      status: FeedbackRoundStatus.Submitted,
      submitted_at: new Date(),
      submitted_by_portal_membership_id: actor.membershipId,
    });
    const activityActor = portalFeedbackService.activityActor(actor);
    await feedbackRoundTaskService.ensureOpenForSubmission(
      tx,
      submitted,
      activityActor,
    );
    await feedbackRoundActivityService.recordSubmitted(
      tx,
      submitted,
      activityActor,
    );
    await announceFeedbackRound(
      tx,
      submitted,
      projectTitle,
      SystemMessageKey.FeedbackRoundSubmitted,
    );
    return {
      ok: true,
      value: {
        alreadySubmitted: false,
        round: await portalFeedbackService.toRoundDto(tx, actor, submitted),
      },
    };
  });
}
