import "server-only";

import { asc, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { MessageAttachmentDto } from "@invessiv/common/contracts/crm/message-attachment.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { files, messageFiles } from "@invessiv/db/record-configuration";
import { messageMappingService } from "./message-mapping-service";

/** The caller has authorized every id for this customer; the order becomes the display order. */
async function attach(
  tx: ContactDatabaseTransaction,
  message: { id: string; customer_id: string },
  fileIds: readonly string[],
) {
  if (fileIds.length === 0) return;
  await tx.insert(messageFiles).values(
    fileIds.map((fileId, position) => ({
      id: crypto.randomUUID(),
      message_id: message.id,
      file_id: fileId,
      customer_id: message.customer_id,
      position,
    })),
  );
}

async function listFileIds(
  tx: ContactDatabaseTransaction,
  messageId: string,
): Promise<string[]> {
  const rows = await tx
    .select({ fileId: messageFiles.file_id })
    .from(messageFiles)
    .where(eq(messageFiles.message_id, messageId))
    .orderBy(asc(messageFiles.position));
  return rows.map((row) => row.fileId);
}

/**
 * One query for a whole page. `visibility` is the caller's file filter (portal release or internal
 * scope); an entry outside it is still listed, but mapped without anything that identifies it.
 */
async function loadByMessage(
  tx: ContactDatabaseTransaction,
  messageIds: readonly string[],
  visibility: SQL,
): Promise<Map<string, MessageAttachmentDto[]>> {
  const byMessage = new Map<string, MessageAttachmentDto[]>();
  if (messageIds.length === 0) return byMessage;
  const rows = await tx
    .select({
      messageId: messageFiles.message_id,
      position: messageFiles.position,
      available: sql<boolean>`coalesce((${visibility}), false)`,
      fileId: files.id,
      displayName: files.display_name,
      assetKind: files.asset_kind,
      url: files.url,
    })
    .from(messageFiles)
    .innerJoin(files, eq(files.id, messageFiles.file_id))
    .where(inArray(messageFiles.message_id, [...messageIds]))
    .orderBy(asc(messageFiles.message_id), asc(messageFiles.position));
  for (const row of rows) {
    const list = byMessage.get(row.messageId) ?? [];
    list.push(messageMappingService.toAttachmentDto(row));
    byMessage.set(row.messageId, list);
  }
  return byMessage;
}

export const messageAttachmentService = {
  attach,
  listFileIds,
  loadByMessage,
} as const;
