import type { ConversationDto } from "./conversation.dto";
import type { ConversationOwnershipDto } from "./conversation-ownership.dto";

export interface InternalConversationDto extends ConversationDto {
  /** Null until the first message creates the conversation; nobody is responsible before that. */
  ownership: ConversationOwnershipDto | null;
}
