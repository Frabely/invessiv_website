import "server-only";

import { eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { users } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { conversationService } from "@/server/shared/services/message/conversation-service";
import { messageMappingService } from "@/server/shared/services/message/message-mapping-service";
import { messageService } from "@/server/shared/services/message/message-service";
import { internalConversationService } from "@/server/workspace/crm/services/internal-conversation-service";

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

async function appendToVisibleConversation(
  tx: ContactDatabaseTransaction,
  customerId: string,
  input: SendMessageInput,
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
  const conversation = await conversationService.ensureCustomerConversation(
    tx,
    customerId,
  );
  const senderDisplayName = await getSenderDisplayName(tx, actor.userId);
  if (!conversation || !senderDisplayName)
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  const sender = internalConversationService.readerOf(actor);
  const message = await messageService.appendTextMessage(tx, {
    clientMessageId: input.clientMessageId,
    conversationId: conversation.id,
    customerId,
    body: input.body,
    sender,
    senderDisplayName,
    actorType: ActorType.User,
    actorUserId: actor.userId,
  });
  if (!message)
    return { ok: false, code: MessageErrorCode.ValidationError } as const;
  return {
    ok: true,
    message: messageMappingService.toDto(message, sender),
  } as const;
}

export async function sendInternalMessage(
  customerId: string,
  input: SendMessageInput,
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
