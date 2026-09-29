import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import type { SendMessageData } from "@invessiv/common/contracts/crm/send-message.input";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { files, users } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { customerFileVisibilityService } from "@/server/shared/files/customer-file-visibility-service";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import type { ConversationReader } from "@/server/shared/services/message/conversation-reader-types";
import { conversationService } from "@/server/shared/services/message/conversation-service";
import { messageService } from "@/server/shared/services/message/message-service";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { fileActivityService } from "@/server/workspace/crm/services/files/file-activity-service";
import { internalConversationService } from "@/server/workspace/crm/services/internal-conversation-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

type AttachmentCheck =
  { ok: true; hidden: FileRow[] } | { ok: false; code: MessageErrorCode };

async function getSenderDisplayName(
  tx: ContactDatabaseTransaction,
  userId: string,
): Promise<string | null> {
  const [sender] = await tx
    .select({ displayName: users.display_name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return sender?.displayName ?? null;
}

/** A delivered send is answered as such, even if one of its attachments changed since. */
async function findRetriedSend(
  tx: ContactDatabaseTransaction,
  customerId: string,
  input: SendMessageData,
  sender: ConversationReader,
) {
  const conversation = await conversationService.findCustomerConversation(
    tx,
    customerId,
  );
  if (!conversation) return null;
  return messageService.findMatchingTextMessage(tx, {
    clientMessageId: input.clientMessageId,
    conversationId: conversation.id,
    body: input.body,
    attachmentFileIds: input.attachmentFileIds,
    sender,
  });
}

/**
 * Locks every attached entry. Unreadable or foreign ids look absent; entries the customer could
 * never open are refused. Internal entries additionally need `files.write` and the confirmation.
 */
async function checkAttachments(
  tx: ContactDatabaseTransaction,
  customerId: string,
  input: SendMessageData,
  actor: WorkspaceActor,
): Promise<AttachmentCheck> {
  const ids = input.attachmentFileIds;
  if (ids.length === 0) return { ok: true, hidden: [] };
  const openable = customerFileVisibilityService.openableCondition(customerId);
  const rows = await tx
    .select({
      file: files,
      openable: sql<boolean>`coalesce((
      ${openable}
      ),
      false
      )`,
    })
    .from(files)
    .where(
      and(
        inArray(files.id, [...ids]),
        eq(files.customer_id, customerId),
        fileAccessService.condition(actor, Permission.FilesRead),
      ),
    )
    .for("update");
  if (rows.length !== ids.length)
    return { ok: false, code: MessageErrorCode.NotFound };
  if (rows.some((row) => !row.openable))
    return { ok: false, code: MessageErrorCode.AttachmentUnavailable };
  const hidden = rows
    .map((row) => row.file)
    .filter((file) => !file.visible_to_customer);
  if (
    hidden.some(
      (file) =>
        !canOn(actor, Permission.FilesWrite, {
          customerId,
          projectId: file.project_id ?? undefined,
        }),
    )
  )
    return { ok: false, code: MessageErrorCode.NotFound };
  if (hidden.length > 0 && !input.releaseHiddenAttachments)
    return { ok: false, code: MessageErrorCode.AttachmentReleaseRequired };
  return { ok: true, hidden };
}

/** Runs only for a newly created message, so a retry never re-releases a file hidden since. */
async function releaseToCustomer(
  tx: ContactDatabaseTransaction,
  hidden: readonly FileRow[],
  actor: WorkspaceActor,
) {
  for (const row of hidden) {
    const released = await updateVersioned({
      tx,
      table: files,
      id: row.id,
      expectedVersion: row.version,
      patch: { visible_to_customer: true },
      toDto: (current) => current,
    });
    if (!released.ok)
      throw new Error("Locked attachment changed during release");
    await fileActivityService.recordChanges(tx, row, released.value, actor);
  }
}

async function appendToVisibleConversation(
  tx: ContactDatabaseTransaction,
  customerId: string,
  input: SendMessageData,
  actor: WorkspaceActor,
) {
  if (
    !(await internalConversationService.isCustomerVisible(
      tx,
      customerId,
      actor,
      Permission.ChatWrite,
    ))
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  const sender = internalConversationService.readerOf(actor);
  const visibility = fileAccessService.readableCondition(actor);
  const retried = await findRetriedSend(tx, customerId, input, sender);
  if (retried)
    return {
      ok: true,
      message: await messageService.toViewerDto(
        tx,
        retried,
        sender,
        visibility,
      ),
    } as const;
  const attachments = await checkAttachments(tx, customerId, input, actor);
  if (!attachments.ok) return attachments;
  const conversation = await conversationService.ensureCustomerConversation(
    tx,
    customerId,
  );
  const senderDisplayName = await getSenderDisplayName(tx, actor.userId);
  if (!conversation || !senderDisplayName)
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  const appended = await messageService.appendTextMessage(tx, {
    clientMessageId: input.clientMessageId,
    conversationId: conversation.id,
    customerId,
    body: input.body,
    attachmentFileIds: input.attachmentFileIds,
    sender,
    senderDisplayName,
    actorType: ActorType.User,
    actorUserId: actor.userId,
  });
  if (!appended)
    return { ok: false, code: MessageErrorCode.ValidationError } as const;
  if (appended.created) await releaseToCustomer(tx, attachments.hidden, actor);
  return {
    ok: true,
    message: await messageService.toViewerDto(
      tx,
      appended.message,
      sender,
      visibility,
    ),
  } as const;
}

export async function sendInternalMessage(
  customerId: string,
  input: SendMessageData,
  actor: WorkspaceActor,
) {
  if (
    !isUuid(customerId) ||
    !canOn(actor, Permission.ChatWrite, { customerId })
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction((tx) =>
    appendToVisibleConversation(tx, customerId, input, actor),
  );
}
