import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { conversationApiService } from "@/client/shared/conversation-api-service";
import type { MessageClientResult } from "@/common/contracts/crm/message-client-result";
import {
  portalConversationEndpoint,
  portalConversationMessagesEndpoint,
  portalConversationReadEndpoint,
} from "@/common/patterns/portal/portal-api-endpoints";

function getConversation(
  customerId: string,
  cursor: string | null,
): Promise<MessageClientResult<PortalConversationDto>> {
  return conversationApiService.getConversation<PortalConversationDto>(
    portalConversationEndpoint(customerId),
    cursor,
  );
}

function sendMessage(
  customerId: string,
  input: SendMessageInput,
): Promise<MessageClientResult<MessageDto>> {
  return conversationApiService.sendMessage(
    portalConversationMessagesEndpoint(customerId),
    input,
  );
}

function markRead(customerId: string): Promise<MessageClientResult<true>> {
  return conversationApiService.markRead(
    portalConversationReadEndpoint(customerId),
  );
}

export const portalMessagesApiService = {
  getConversation,
  sendMessage,
  markRead,
} as const;
