import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import type { MessageClientResult } from "./message-client-result";

/** Requests one side (CRM or portal) needs to drive a conversation; bound to a customer. */
export type ConversationThreadApi<TConversation extends ConversationDto> = {
  /** Newest page for `null`, otherwise the page before the cursor. */
  getConversation: (
    cursor: string | null,
  ) => Promise<MessageClientResult<TConversation>>;
  sendMessage: (
    input: SendMessageInput,
  ) => Promise<MessageClientResult<MessageDto>>;
  markRead: () => Promise<MessageClientResult<true>>;
};
