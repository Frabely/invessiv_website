import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";
import { eq } from "drizzle-orm";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { feedbackRounds } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { fileSchemas } from "../services/files/file-schemas";
import { fileAccessService } from "../services/files/file-access-service";
import { fileActivityService } from "../services/files/file-activity-service";
import { fileObjectService } from "@/server/shared/files/file-object-service";
import { fileService } from "../services/files/file-service";

/**
 * Submitted feedback is evidence of what the customer asked for, so its files stay. The share lock
 * keeps the customer from submitting while this delete is still running.
 */
async function isInOpenFeedbackRound(
  tx: ContactDatabaseTransaction,
  roundId: string,
): Promise<boolean> {
  const [round] = await tx
    .select({ status: feedbackRounds.status })
    .from(feedbackRounds)
    .where(eq(feedbackRounds.id, roundId))
    .for("share");
  return round?.status === FeedbackRoundStatus.Open;
}

export async function deleteFile(
  id: string,
  input: VersionedWriteInput,
  actor: WorkspaceActor,
): Promise<FileResult<{ deleted: true }>> {
  if (!fileSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  const parsed = fileSchemas.delete.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await fileAccessService.lock(
      tx,
      id,
      actor,
      Permission.FilesDelete,
    );
    if (!row || row.status !== FileStatus.Ready)
      return { ok: false, code: E.NotFound };
    if (row.version !== parsed.data.version) return fileService.conflict(row);
    if (
      row.feedback_round_id &&
      !(await isInOpenFeedbackRound(tx, row.feedback_round_id))
    )
      return { ok: false, code: E.FeedbackBound };
    if (!(await fileObjectService.remove(tx, row)))
      return { ok: false, code: E.StorageUnavailable };
    await fileActivityService.record(tx, row, actor, ActivityType.FieldChange, [
      "deleted",
    ]);
    return { ok: true, value: { deleted: true } };
  });
}
