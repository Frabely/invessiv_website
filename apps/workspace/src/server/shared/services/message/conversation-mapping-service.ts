import "server-only";

import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import { conversations } from "@invessiv/db/record-configuration";

/** A customer without any message has no row yet; both sides then show an empty thread. */
function toConversationDto(
  row: typeof conversations.$inferSelect | null,
  customerId: string,
  unreadCount: number,
  page: Pick<ConversationDto, "messages" | "nextCursor">,
): ConversationDto {
  if (!row)
    return {
      id: null,
      customerId,
      unreadCount: 0,
      lastMessageAt: null,
      messages: [],
      nextCursor: null,
    };
  return {
    id: row.id,
    customerId: row.customer_id,
    unreadCount,
    lastMessageAt: row.last_message_at?.toISOString() ?? null,
    ...page,
  };
}

export const conversationMappingService = { toConversationDto } as const;
