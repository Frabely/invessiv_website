import type { MessageDto } from "./message.dto";

export interface ConversationDto {
  /** Stable conversation identifier for this customer. */
  id: string;
  /** Customer whose members can read the conversation. */
  customerId: string;
  /** Messages from the other side after this viewer's read timestamp. */
  unreadCount: number;
  /** Null while no message has been sent. */
  lastMessageAt: string | null;
  /** Loaded page returned in chronological order. */
  messages: MessageDto[];
  /** Opaque position for fetching older messages; null at the beginning. */
  nextCursor: string | null;
}
