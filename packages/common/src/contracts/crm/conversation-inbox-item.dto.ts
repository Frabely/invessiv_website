import type { MessageDto } from "./message.dto";

export interface ConversationInboxItemDto {
  /** Identifier used to open the shared conversation. */
  id: string;
  /** Customer id used by the customer scoped API. */
  customerId: string;
  /** Current customer name shown in the inbox. */
  customerDisplayName: string;
  /** Current responsible internal membership. */
  ownerMemberId: string;
  /** Current display name of the responsible member. */
  ownerDisplayName: string;
  /** Messages from the customer newer than this member's read position. */
  unreadCount: number;
  /** Null until the first message arrives. */
  lastMessageAt: string | null;
  /** Newest message for the preview; redacted content is already removed. */
  lastMessage: MessageDto | null;
}
