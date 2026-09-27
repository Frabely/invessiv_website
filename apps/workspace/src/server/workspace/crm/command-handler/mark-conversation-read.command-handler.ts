import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import type { MarkConversationReadInput } from "@invessiv/common/contracts/crm/mark-conversation-read.input";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { conversationService } from "@/server/shared/services/message/conversation-service";
import { internalConversationService } from "@/server/workspace/crm/services/internal-conversation-service";

export async function markConversationRead(
  customerId: string,
  input: MarkConversationReadInput,
  actor: WorkspaceActor,
) {
  if (!isUuid(customerId) || !canOn(actor, Permission.ChatRead, { customerId }))
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const conversation = await conversationService.findCustomerConversation(
      tx,
      customerId,
    );
    if (!conversation)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    const marked = await conversationService.markReadThroughMessage(
      tx,
      conversation.id,
      input.lastSeenMessageId,
      internalConversationService.readerOf(actor),
    );
    return marked
      ? ({ ok: true } as const)
      : ({ ok: false, code: MessageErrorCode.ValidationError } as const);
  });
}
