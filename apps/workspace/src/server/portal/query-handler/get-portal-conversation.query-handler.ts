import "server-only";

import { and, isNull } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { conversations } from "@invessiv/db/record-configuration";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { messageService } from "@/server/shared/services/message/message-service";
import { conversationMappingService } from "@/server/shared/services/message/conversation-mapping-service";

export async function getPortalConversation(
  reader: PortalReader,
  cursor: string | null,
): Promise<ConversationDto | null> {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const [conversation] = await tx
      .select()
      .from(conversations)
      .where(
        and(
          isNull(conversations.project_id),
          portalAccessCondition.forReader(
            reader,
            Permission.PortalMessagesRead,
            {
              customerId: conversations.customer_id,
            },
          ),
        ),
      )
      .limit(1);
    if (!conversation) {
      if (!reader.permissions.has(Permission.PortalMessagesRead)) return null;
      return {
        id: "",
        customerId: reader.customerId,
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
      isPortalOwnerView(reader) ? null : reader.membershipId,
    );
    if (!page) return null;
    const unreadCount = isPortalOwnerView(reader)
      ? 0
      : await messageService.countUnreadMessages(
          tx,
          conversation.id,
          MessageSenderSide.Customer,
          null,
          reader.membershipId,
        );
    return conversationMappingService.toConversationDto(
      conversation,
      unreadCount,
      page,
    );
  });
}
