import "server-only";

import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
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
  toInboxItemDto,
} as const;
