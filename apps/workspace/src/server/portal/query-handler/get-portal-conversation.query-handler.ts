import "server-only";

import { and, isNull } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { conversations } from "@invessiv/db/record-configuration";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { messageService } from "@/server/shared/services/message/message-service";
import { conversationMappingService } from "@/server/shared/services/message/conversation-mapping-service";

export async function getPortalConversation(
  reader: PortalReader,
  cursor: string | null,
): Promise<PortalConversationDto | null> {
  if (
    !portalCanOn.forReader(reader, Permission.PortalMessagesRead, {
      customerId: reader.customerId,
    })
  )
    return null;
  const ownerView = isPortalOwnerView(reader);
  const canWrite =
    !ownerView &&
    portalCanOn.forActor(reader, Permission.PortalMessagesWrite, {
      customerId: reader.customerId,
    });
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
    if (!conversation)
      return conversationMappingService.toPortalDto(
        null,
        reader.customerId,
        0,
        { messages: [], nextCursor: null },
        canWrite,
      );
    const page = await messageService.getMessagePage(
      tx,
      conversation.id,
      cursor,
      null,
      ownerView ? null : reader.membershipId,
    );
    if (!page) return null;
    const unreadCount = ownerView
      ? 0
      : await messageService.countUnreadMessages(
          tx,
          conversation.id,
          MessageSenderSide.Customer,
          null,
          reader.membershipId,
        );
    return conversationMappingService.toPortalDto(
      conversation,
      reader.customerId,
      unreadCount,
      page,
      canWrite,
    );
  });
}
