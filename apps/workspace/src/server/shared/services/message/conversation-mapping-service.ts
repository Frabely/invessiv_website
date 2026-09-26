import "server-only";

import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
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
): InternalConversationDto {
  return {
    ...toConversationDto(row, unreadCount, page),
    ownerMemberId: row.owner_member_id,
    ownerDisplayName,
    version: row.version,
  };
}

function toInboxItemDto(
  row: typeof conversations.$inferSelect,
  customerDisplayName: string,
  unreadCount: number,
): ConversationInboxItemDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerDisplayName,
    ownerMemberId: row.owner_member_id,
    unreadCount,
    lastMessageAt: row.last_message_at?.toISOString() ?? null,
  };
}

export const conversationMappingService = {
  toConversationDto,
  toInternalDto,
  toInboxItemDto,
} as const;
