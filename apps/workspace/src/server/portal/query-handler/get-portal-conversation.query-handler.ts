import "server-only";

import { and, isNull } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { conversations } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { messageService } from "@/server/shared/services/message/message-service";

export async function getPortalConversation(
  actor: PortalActor,
  cursor: string | null,
): Promise<ConversationDto | null> {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const [conversation] = await tx
      .select()
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
    if (!conversation) {
      if (!actor.permissions.has(Permission.PortalMessagesRead)) return null;
      return {
        id: "",
        customerId: actor.customerId,
        unreadCount: 0,
        lastMessageAt: null,
        messages: [],
        nextCursor: null,
      };
    }
    const page = await messageService.getMessagePage(
      tx,
      conversation.id,
      cursor,
      null,
      actor.membershipId,
    );
    if (!page) return null;
    return {
      id: conversation.id,
      customerId: actor.customerId,
      unreadCount: await messageService.countUnreadMessages(
        tx,
        conversation.id,
        MessageSenderSide.Customer,
        null,
        actor.membershipId,
      ),
      lastMessageAt: conversation.last_message_at?.toISOString() ?? null,
      ...page,
    };
  });
}
