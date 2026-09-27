import "server-only";

import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { conversations } from "@invessiv/db/record-configuration";

/** Without a row there is no responsible member yet; the thread itself is still shown empty. */
function toInternalDto(
  conversation: ConversationDto,
  row: typeof conversations.$inferSelect | null,
  ownerDisplayName: string,
): InternalConversationDto {
  return {
    ...conversation,
    ownership: row
      ? {
          ownerMemberId: row.owner_member_id,
          ownerDisplayName,
          version: row.version,
        }
      : null,
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

export const internalConversationMappingService = {
  toInternalDto,
  toInboxItemDto,
} as const;
