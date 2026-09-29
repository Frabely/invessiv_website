import "server-only";

import { inArray } from "drizzle-orm";

import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { feedbackMappingService } from "./feedback-mapping-service";
import type {
  FeedbackRoundRef,
  LockedFeedbackFile,
} from "./feedback-service-types";

/**
 * The two feedback columns of a file are only ever written here, so binding and unbinding cannot
 * drift apart. Attaching lives next to detaching for that reason, although only the portal attaches.
 */
async function writeBinding(
  tx: ContactDatabaseTransaction,
  file: LockedFeedbackFile,
  patch: Pick<
    typeof files.$inferInsert,
    "feedback_round_id" | "feedback_item_id" | "project_id"
  >,
): Promise<FeedbackAttachmentDto> {
  const row = await updateLockedVersioned(
    { tx, table: files, id: file.id, expectedVersion: file.version, patch },
    "Locked feedback file changed",
  );
  return feedbackMappingService.fileToAttachmentDto(row);
}

/** A file without project joins the round's project; the item binding requires one. */
function attachFile(
  tx: ContactDatabaseTransaction,
  file: LockedFeedbackFile,
  target: { round: FeedbackRoundRef; itemId: string },
): Promise<FeedbackAttachmentDto> {
  return writeBinding(tx, file, {
    feedback_round_id: target.round.id,
    feedback_item_id: target.itemId,
    project_id: target.round.project_id,
  });
}

/** The file stays with the customer under "your uploads"; only its feedback binding goes. */
function detachFile(
  tx: ContactDatabaseTransaction,
  file: LockedFeedbackFile,
): Promise<FeedbackAttachmentDto> {
  return writeBinding(tx, file, {
    feedback_round_id: null,
    feedback_item_id: null,
  });
}

/** Unbinds every file of items that are about to be deleted. */
async function detachItemFiles(
  tx: ContactDatabaseTransaction,
  itemIds: readonly string[],
): Promise<void> {
  if (itemIds.length === 0) return;
  const bound = await tx
    .select({ id: files.id, version: files.version })
    .from(files)
    .where(inArray(files.feedback_item_id, [...itemIds]))
    .for("update");
  for (const file of bound) await detachFile(tx, file);
}

export const feedbackAttachmentService = {
  attachFile,
  detachFile,
  detachItemFiles,
} as const;
