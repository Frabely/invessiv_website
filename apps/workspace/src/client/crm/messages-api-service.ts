import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import type { UpdateConversationOwnerInput } from "@invessiv/common/contracts/crm/update-conversation-owner.input";
import { conversationApiService } from "@/client/shared/conversation-api-service";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { ConversationOwnerAssignment } from "@/common/contracts/crm/conversation-owner-assignment";
import type { ConversationOwnerClientResult } from "@/common/contracts/crm/conversation-owner-client-result";
import type { MessageClientResult } from "@/common/contracts/crm/message-client-result";
import {
  crmCustomerConversationEndpoint,
  crmCustomerConversationMessagesEndpoint,
  crmCustomerConversationOwnerEndpoint,
  crmCustomerConversationReadEndpoint,
  crmMessageRedactEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord, send } = versionedJsonMutationService;

function isOwnerAssignment(
  value: unknown,
): value is ConversationOwnerAssignment {
  return (
    isRecord(value) &&
    typeof value.ownerMemberId === "string" &&
    typeof value.version === "number"
  );
}

function getConversation(
  customerId: string,
  cursor: string | null,
): Promise<MessageClientResult<InternalConversationDto>> {
  return conversationApiService.getConversation<InternalConversationDto>(
    crmCustomerConversationEndpoint(customerId),
    cursor,
  );
}

function sendMessage(
  customerId: string,
  input: SendMessageInput,
): Promise<MessageClientResult<MessageDto>> {
  return conversationApiService.sendMessage(
    crmCustomerConversationMessagesEndpoint(customerId),
    input,
  );
}

function markRead(customerId: string): Promise<MessageClientResult<true>> {
  return conversationApiService.markRead(
    crmCustomerConversationReadEndpoint(customerId),
  );
}

function redactMessage(messageId: string): Promise<MessageClientResult<true>> {
  return conversationApiService.request(
    crmMessageRedactEndpoint(messageId),
    HttpMethod.Post,
    undefined,
    () => true,
  );
}

async function updateOwner(
  customerId: string,
  input: UpdateConversationOwnerInput,
): Promise<ConversationOwnerClientResult> {
  const response = await send(
    crmCustomerConversationOwnerEndpoint(customerId),
    HttpMethod.Patch,
    input,
  );
  if (!response) return { ok: false, code: MessageErrorCode.Internal };
  if (response.ok && isOwnerAssignment(response.payload))
    return { ok: true, assignment: response.payload };
  const current = versionedJsonMutationService.readVersionConflict(
    response,
    isOwnerAssignment,
  );
  return current
    ? { ok: false, code: ConcurrencyErrorCode.VersionConflict, current }
    : {
        ok: false,
        code: conversationApiService.readErrorCode(response.payload),
      };
}

export const messagesApiService = {
  getConversation,
  sendMessage,
  markRead,
  redactMessage,
  updateOwner,
} as const;
