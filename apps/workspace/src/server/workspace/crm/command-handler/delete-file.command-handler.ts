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
import { feedbackRounds, files } from "@invessiv/db/record-configuration";
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
async function lockFeedbackRoundStatus(
  tx: ContactDatabaseTransaction,
  roundId: string,
): Promise<FeedbackRoundStatus | null> {
  const [round] = await tx
    .select({ status: feedbackRounds.status })
    .from(feedbackRounds)
    .where(eq(feedbackRounds.id, roundId))
    .for("share");
  return round?.status ?? null;
}

/**
 * Feedback writes lock round → items → files. The file lock below comes last for the same reason, so
 * the round of a bound file is locked before the file itself: the file's binding is read unlocked
 * first and re-checked once the file is locked.
 */
async function lockBoundRoundFirst(
  tx: ContactDatabaseTransaction,
  fileId: string,
): Promise<{ roundId: string | null; status: FeedbackRoundStatus | null }> {
  const [bound] = await tx
    .select({ roundId: files.feedback_round_id })
    .from(files)
    .where(eq(files.id, fileId));
  const roundId = bound?.roundId ?? null;
  return {
    roundId,
    status: roundId ? await lockFeedbackRoundStatus(tx, roundId) : null,
  };
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
    const round = await lockBoundRoundFirst(tx, id);
    const row = await fileAccessService.lock(
      tx,
      id,
      actor,
      Permission.FilesDelete,
    );
    if (!row || row.status !== FileStatus.Ready)
      return { ok: false, code: E.NotFound };
    if (row.version !== parsed.data.version) return fileService.conflict(row);
    if (row.feedback_round_id !== round.roundId)
      return fileService.conflict(row);
    if (round.roundId && round.status !== FeedbackRoundStatus.Open)
      return { ok: false, code: E.FeedbackBound };
    if (!(await fileObjectService.remove(tx, row)))
      return { ok: false, code: E.StorageUnavailable };
    await fileActivityService.record(tx, row, actor, ActivityType.FieldChange, [
      "deleted",
    ]);
    return { ok: true, value: { deleted: true } };
  });
}
