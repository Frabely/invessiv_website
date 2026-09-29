import "server-only";

import { and, eq } from "drizzle-orm";

import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { AttachPortalFeedbackFileRequestDto } from "@invessiv/common/contracts/portal/attach-portal-feedback-file-request.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { feedbackRoundItems, files } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { feedbackMappingService } from "@/server/shared/services/feedback/feedback-mapping-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";
import type { FileRow } from "@/server/shared/files/file-object-service-types";

type Result = PortalFeedbackResult<FeedbackAttachmentDto>;

const NOT_FOUND = {
  ok: false,
  code: PortalFeedbackErrorCode.NotFound,
} as const;

async function itemExists(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  itemId: string,
): Promise<boolean> {
  const [item] = await tx
    .select({ id: feedbackRoundItems.id })
    .from(feedbackRoundItems)
    .where(
      and(
        eq(feedbackRoundItems.id, itemId),
        eq(feedbackRoundItems.round_id, round.id),
      ),
    )
    .limit(1);
  return !!item;
}

/** A file the customer cannot see (internal, foreign company) answers like a missing one. */
async function lockCustomerFile(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  fileId: string,
): Promise<FileRow | null> {
  const [file] = await tx
    .select()
    .from(files)
    .where(
      and(
        eq(files.id, fileId),
        eq(files.customer_id, actor.customerId),
        eq(files.visible_to_customer, true),
      ),
    )
    .limit(1)
    .for("update");
  return file ?? null;
}

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

async function exceedsLimits(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  itemId: string,
): Promise<boolean> {
  const counts = await feedbackRoundItemService.countAttachments(tx, {
    roundId: round.id,
    itemId,
  });
  return (
    counts.onItem >= FEEDBACK_LIMITS.filesPerItem ||
    counts.onRound >= FEEDBACK_LIMITS.filesPerRound
  );
}

/**
 * Hangs an uploaded file onto an item of an open round. The round lock serializes attachments, so
 * the limits cannot be passed by parallel requests. Repeating an attachment is a success.
 */
export async function attachPortalFeedbackFile(
  actor: PortalActor,
  target: { roundId: string; itemId: string },
  input: AttachPortalFeedbackFileRequestDto,
): Promise<Result> {
  const parsed = portalFeedbackSchemas.attach.safeParse(input);
  if (!parsed.success)
    return { ok: false, code: PortalFeedbackErrorCode.Validation };
  if (!portalFeedbackSchemas.id.safeParse(target.itemId).success)
    return NOT_FOUND;
  const itemId = target.itemId.toLowerCase();

  return getDrizzleDatabaseClient().transaction(async (tx): Promise<Result> => {
    const locked = await portalFeedbackService.lockRound(
      tx,
      actor,
      target.roundId,
    );
    if (!locked) return NOT_FOUND;
    const { round } = locked;
    const rejected = await portalFeedbackService.rejectUnlessOpen(
      tx,
      actor,
      round,
    );
    if (rejected) return rejected;
    if (!(await itemExists(tx, round, itemId))) return NOT_FOUND;
    const file = await lockCustomerFile(tx, actor, parsed.data.fileId);
    if (!file) return NOT_FOUND;
    if (file.feedback_item_id === itemId)
      return {
        ok: true,
        value: feedbackMappingService.fileToAttachmentDto(file),
      };
    if (!isAttachable(file, round))
      return { ok: false, code: PortalFeedbackErrorCode.NotAttachable };
    if (await exceedsLimits(tx, round, itemId))
      return { ok: false, code: PortalFeedbackErrorCode.AttachmentLimit };

    return {
      ok: true,
      value: await feedbackRoundItemService.attachFile(tx, file, {
        round,
        itemId,
      }),
    };
  });
}
