export interface ConversationInboxItemDto {
  /** Identifier used to open the shared conversation. */
  id: string;
  /** Customer id used by the customer scoped API. */
  customerId: string;
  /** Current customer name shown in the inbox. */
  customerDisplayName: string;
  /** Current responsible internal membership. */
  ownerMemberId: string;
  /** Messages from the customer newer than this member's read position. */
  unreadCount: number;
  /** Null until the first message arrives. */
  lastMessageAt: string | null;
}
