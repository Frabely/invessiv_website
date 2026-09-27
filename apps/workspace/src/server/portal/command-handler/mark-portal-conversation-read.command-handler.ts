import "server-only";

import { and, isNull } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import type { MarkConversationReadInput } from "@invessiv/common/contracts/crm/mark-conversation-read.input";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { conversations } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { messageService } from "@/server/shared/services/message/message-service";

export async function markPortalConversationRead(
  actor: PortalActor,
  input: MarkConversationReadInput,
) {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const [conversation] = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          isNull(conversations.project_id),
          portalAccessCondition.forActor(actor, Permission.PortalMessagesRead, {
            customerId: conversations.customer_id,
          }),
        ),
      )
      .limit(1);
    if (!conversation)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    const marked = await messageService.markConversationReadThroughMessage(
      tx,
      conversation.id,
      input.lastSeenMessageId,
      null,
      actor.membershipId,
    );
    return marked
      ? ({ ok: true } as const)
      : ({ ok: false, code: MessageErrorCode.ValidationError } as const);
  });
}
