import "server-only";

import { eq, sql } from "drizzle-orm";

import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { AttachPortalFeedbackFileRequestDto } from "@invessiv/common/contracts/portal/attach-portal-feedback-file-request.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import { feedbackAttachmentService } from "@/server/shared/services/feedback/feedback-attachment-service";
import { feedbackMappingService } from "@/server/shared/services/feedback/feedback-mapping-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";

type Result = PortalFeedbackResult<FileAttachmentDto>;

/** Only a finished own upload or link that is still free and fits the round's project. */
function isAttachable(file: FileRow, round: FeedbackRoundRow): boolean {
  return (
    file.uploaded_by_side === UploadSide.Customer &&
    file.status === FileStatus.Ready &&
    file.orphaned_at === null &&
    file.feedback_item_id === null &&
    (file.project_id === null || file.project_id === round.project_id)
  );
}

/** Counted under the round lock, so parallel attachments cannot pass either limit. */
async function exceedsLimits(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  itemId: string,
): Promise<boolean> {
  const [counts] = await tx
    .select({
      onItem:
        sql<number>`count(*) filter (where ${files.feedback_item_id} = ${itemId})`.mapWith(
          Number,
        ),
      onRound: sql<number>`count(*)`.mapWith(Number),
    })
    .from(files)
    .where(eq(files.feedback_round_id, round.id));
  return (
    (counts?.onItem ?? 0) >= FEEDBACK_LIMITS.filesPerItem ||
    (counts?.onRound ?? 0) >= FEEDBACK_LIMITS.filesPerRound
  );
}

async function attachToItem(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  round: FeedbackRoundRow,
  target: { itemId: string; fileId: string },
): Promise<Result> {
  if (!(await portalFeedbackService.hasItem(tx, round.id, target.itemId)))
    return portalFeedbackService.notFound();
  const file = await portalFileService.lockVisible(tx, actor, target.fileId);
  if (!file) return portalFeedbackService.notFound();
  if (file.feedback_item_id === target.itemId)
    return {
      ok: true,
      value: feedbackMappingService.toAttachmentDto(file),
    };
  if (!isAttachable(file, round))
    return { ok: false, code: PortalFeedbackErrorCode.NotAttachable };
  if (await exceedsLimits(tx, round, target.itemId))
    return { ok: false, code: PortalFeedbackErrorCode.AttachmentLimit };
  return {
    ok: true,
    value: await feedbackAttachmentService.attachFile(tx, file, {
      round,
      itemId: target.itemId,
    }),
  };
}

/**
 * Hangs an uploaded file onto an item of an editable round. A file the contact cannot see answers
 * like a missing one; repeating an attachment is a success.
 */
export async function attachPortalFeedbackFile(
  actor: PortalActor,
  target: { roundId: string; itemId: string },
  input: AttachPortalFeedbackFileRequestDto,
): Promise<Result> {
  const parsed = portalFeedbackSchemas.attach.safeParse(input);
  if (!parsed.success)
    return { ok: false, code: PortalFeedbackErrorCode.Validation };
  const itemId = portalFeedbackSchemas.id.safeParse(target.itemId);
  if (!itemId.success || !portalFeedbackService.canAttach(actor))
    return portalFeedbackService.notFound();

  return portalFeedbackService.withLockedRound(
    actor,
    target.roundId,
    async (tx, { round }) =>
      (await portalFeedbackService.rejectUnlessAllowed(
        tx,
        actor,
        round,
        FeedbackRoundStatus.Submitted,
      )) ??
      attachToItem(tx, actor, round, {
        itemId: itemId.data,
        fileId: parsed.data.fileId,
      }),
  );
}
