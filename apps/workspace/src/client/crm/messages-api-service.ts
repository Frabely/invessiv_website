import {
  MESSAGE_ERROR_CODE_VALUES,
  MessageErrorCode,
} from "@invessiv/common/constants/crm/message-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import type { UpdateConversationOwnerInput } from "@invessiv/common/contracts/crm/update-conversation-owner.input";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { ConversationQueryParam } from "@/common/constants/crm/conversation-query-params";
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

// Chat routes answer errors as `{ code, message }`, not the `{ error }` shape of older routes.
function readMessageErrorCode(payload: unknown): MessageErrorCode {
  const code = isRecord(payload) ? payload.code : undefined;
  return (
    MESSAGE_ERROR_CODE_VALUES.find((known) => known === code) ??
    MessageErrorCode.Internal
  );
}

async function request<TValue>(
  url: string,
  method: HttpMethod,
  body: unknown,
  readValue: (payload: unknown) => TValue | null,
): Promise<MessageClientResult<TValue>> {
  const response = await send(url, method, body);
  if (!response) return { ok: false, code: MessageErrorCode.Internal };
  const value = response.ok ? readValue(response.payload) : null;
  return value !== null
    ? { ok: true, value }
    : { ok: false, code: readMessageErrorCode(response.payload) };
}

function isConversation(value: unknown): value is InternalConversationDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    Array.isArray(value.messages)
  );
}

function isMessage(value: unknown): value is MessageDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string"
  );
}

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
  const query = cursor
    ? `?${new URLSearchParams({ [ConversationQueryParam.Cursor]: cursor })}`
    : "";
  return request(
    `${crmCustomerConversationEndpoint(customerId)}${query}`,
    HttpMethod.Get,
    undefined,
    (payload) =>
      isRecord(payload) && isConversation(payload.conversation)
        ? payload.conversation
        : null,
  );
}

function sendMessage(
  customerId: string,
  input: SendMessageInput,
): Promise<MessageClientResult<MessageDto>> {
  return request(
    crmCustomerConversationMessagesEndpoint(customerId),
    HttpMethod.Post,
    input,
    (payload) =>
      isRecord(payload) && isMessage(payload.message) ? payload.message : null,
  );
}

function markRead(customerId: string): Promise<MessageClientResult<true>> {
  return request(
    crmCustomerConversationReadEndpoint(customerId),
    HttpMethod.Post,
    undefined,
    () => true,
  );
}

function redactMessage(messageId: string): Promise<MessageClientResult<true>> {
  return request(
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
    : { ok: false, code: readMessageErrorCode(response.payload) };
}

export const messagesApiService = {
  getConversation,
  sendMessage,
  markRead,
  redactMessage,
  updateOwner,
} as const;
