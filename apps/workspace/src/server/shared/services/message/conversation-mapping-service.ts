import "server-only";

import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { conversations } from "@invessiv/db/record-configuration";

function toConversationDto(
  row: typeof conversations.$inferSelect,
  unreadCount: number,
  page: Pick<ConversationDto, "messages" | "nextCursor">,
): ConversationDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    unreadCount,
    lastMessageAt: row.last_message_at?.toISOString() ?? null,
    ...page,
  };
}

function toInternalDto(
  row: typeof conversations.$inferSelect,
  ownerDisplayName: string,
  unreadCount: number,
  page: Pick<ConversationDto, "messages" | "nextCursor">,
  canRedact: boolean,
): InternalConversationDto {
  return {
    ...toConversationDto(row, unreadCount, page),
    ownerMemberId: row.owner_member_id,
    ownerDisplayName,
    version: row.version,
    canRedact,
  };
}

/** A customer without any message yet has no row; the portal still shows an empty thread. */
function toPortalDto(
  row: typeof conversations.$inferSelect | null,
  customerId: string,
  unreadCount: number,
  page: Pick<ConversationDto, "messages" | "nextCursor">,
  canWrite: boolean,
): PortalConversationDto {
  const conversation = row
    ? toConversationDto(row, unreadCount, page)
    : {
        id: "",
        customerId,
        unreadCount: 0,
        lastMessageAt: null,
        messages: [],
        nextCursor: null,
      };
  return { ...conversation, canWrite };
}

function toInboxItemDto(
  row: typeof conversations.$inferSelect,
  names: { customerDisplayName: string; ownerDisplayName: string },
  unreadCount: number,
  lastMessage: MessageDto | null,
): ConversationInboxItemDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerDisplayName: names.customerDisplayName,
    ownerMemberId: row.owner_member_id,
    ownerDisplayName: names.ownerDisplayName,
    unreadCount,
    lastMessageAt: row.last_message_at?.toISOString() ?? null,
    lastMessage,
  };
}

export const conversationMappingService = {
  toConversationDto,
  toInternalDto,
  toPortalDto,
  toInboxItemDto,
} as const;
