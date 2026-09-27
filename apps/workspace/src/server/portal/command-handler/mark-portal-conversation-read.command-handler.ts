import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import type { MarkConversationReadInput } from "@invessiv/common/contracts/crm/mark-conversation-read.input";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { conversations } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { portalConversationReader } from "@/server/portal/shared/portal-conversation-reader";
import { conversationService } from "@/server/shared/services/message/conversation-service";

export async function markPortalConversationRead(
  actor: PortalActor,
  input: MarkConversationReadInput,
) {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const conversation = await conversationService.findCustomerConversation(
      tx,
      actor.customerId,
      portalAccessCondition.forActor(actor, Permission.PortalMessagesRead, {
        customerId: conversations.customer_id,
      }),
    );
    if (!conversation)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    const marked = await conversationService.markReadThroughMessage(
      tx,
      conversation.id,
      input.lastSeenMessageId,
      portalConversationReader.forActor(actor),
    );
    return marked
      ? ({ ok: true } as const)
      : ({ ok: false, code: MessageErrorCode.ValidationError } as const);
  });
}
