import type { ConversationDto } from "./conversation.dto";

export interface InternalConversationDto extends ConversationDto {
  /** Internal member responsible for this conversation. */
  ownerMemberId: string;
  /** Current display name of the responsible member. */
  ownerDisplayName: string;
  /** Optimistic lock independent of the customer version. */
  version: number;
}
