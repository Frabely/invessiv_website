import "server-only";

import { eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { users } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { messageMappingService } from "@/server/shared/services/message/message-mapping-service";
import { messageService } from "@/server/shared/services/message/message-service";
import { conversationService } from "@/server/workspace/crm/services/conversation-service";

export async function sendInternalMessage(
  customerId: string,
  input: SendMessageInput,
  actor: WorkspaceActor,
) {
  if (!canOn(actor, Permission.ChatWrite, { customerId }))
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const conversation =
      await conversationService.getOrCreateWritableConversation(
        tx,
        customerId,
        actor,
      );
    if (!conversation)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    const [sender] = await tx
      .select({ displayName: users.display_name })
      .from(users)
      .where(eq(users.id, actor.userId))
      .limit(1);
    if (!sender) return { ok: false, code: MessageErrorCode.NotFound } as const;
    const message = await messageService.appendTextMessage(tx, {
      clientMessageId: input.clientMessageId,
      conversationId: conversation.id,
      customerId,
      body: input.body,
      side: MessageSenderSide.Internal,
      memberId: actor.workspaceMemberId,
      portalMembershipId: null,
      displayName: sender.displayName,
      actorType: ActorType.User,
      actorUserId: actor.userId,
    });
    if (!message)
      return { ok: false, code: MessageErrorCode.ValidationError } as const;
    return {
      ok: true,
      message: messageMappingService.toDto(
        message,
        actor.workspaceMemberId,
        null,
      ),
    } as const;
  });
}
