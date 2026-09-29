import "server-only";

import { eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { people } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { portalConversationReader } from "@/server/portal/shared/portal-conversation-reader";
import { customerFileVisibilityService } from "@/server/shared/files/customer-file-visibility-service";
import { conversationService } from "@/server/shared/services/message/conversation-service";
import { messageService } from "@/server/shared/services/message/message-service";

async function getSenderDisplayName(
  tx: ContactDatabaseTransaction,
  personId: string,
): Promise<string | null> {
  const [sender] = await tx
    .select({ displayName: people.display_name })
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);
  return sender?.displayName ?? null;
}

/**
 * The quota check locks the membership first, so the lookup of an earlier successful send and the
 * count cannot race a parallel retry. A retry of a delivered send is answered even above the limit.
 */
async function findRetriedOrThrottledSend(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  input: SendMessageInput,
  conversationId: string,
) {
  const retryAfterSeconds = await messageService.findPortalSendRetryAfter(
    tx,
    actor.membershipId,
  );
  const existing = await messageService.findMatchingTextMessage(tx, {
    clientMessageId: input.clientMessageId,
    conversationId,
    body: input.body,
    attachmentFileIds: input.attachmentFileIds ?? [],
    sender: portalConversationReader.forActor(actor),
  });
  return { existing, retryAfterSeconds };
}

/** A contact attaches only what the portal shows them; the portal never releases anything. */
async function mayAttach(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  fileIds: readonly string[],
): Promise<boolean> {
  if (fileIds.length === 0) return true;
  if (
    !portalCanOn.forActor(actor, Permission.PortalFilesRead, {
      customerId: actor.customerId,
    })
  )
    return false;
  return customerFileVisibilityService.allMatch(
    tx,
    fileIds,
    portalFileService.visibleCondition(actor),
  );
}

async function appendCustomerMessage(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  input: SendMessageInput,
) {
  const sender = portalConversationReader.forActor(actor);
  const conversation = await conversationService.ensureCustomerConversation(
    tx,
    actor.customerId,
  );
  if (!conversation)
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  const { existing, retryAfterSeconds } = await findRetriedOrThrottledSend(
    tx,
    actor,
    input,
    conversation.id,
  );
  const visibility = portalFileService.visibleCondition(actor);
  if (existing)
    return {
      ok: true,
      message: await messageService.toViewerDto(
        tx,
        existing,
        sender,
        visibility,
      ),
    } as const;
  if (retryAfterSeconds !== null)
    return {
      ok: false,
      code: MessageErrorCode.RateLimited,
      retryAfterSeconds,
    } as const;
  if (!(await mayAttach(tx, actor, input.attachmentFileIds ?? [])))
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  const senderDisplayName = await getSenderDisplayName(tx, actor.personId);
  if (!senderDisplayName)
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  const appended = await messageService.appendTextMessage(tx, {
    clientMessageId: input.clientMessageId,
    conversationId: conversation.id,
    customerId: actor.customerId,
    body: input.body,
    attachmentFileIds: input.attachmentFileIds ?? [],
    sender,
    senderDisplayName,
    actorType: ActorType.Customer,
    actorUserId: actor.userId,
  });
  if (!appended)
    return { ok: false, code: MessageErrorCode.ValidationError } as const;
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

export async function sendCustomerMessage(
  actor: PortalActor,
  input: SendMessageInput,
) {
  if (
    !portalCanOn.forActor(actor, Permission.PortalMessagesWrite, {
      customerId: actor.customerId,
    })
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction((tx) =>
    appendCustomerMessage(tx, actor, input),
  );
}
