import {
  MESSAGE_ERROR_CODE_VALUES,
  MessageErrorCode,
} from "@invessiv/common/constants/crm/errors/message-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import { ConversationQueryParam } from "@/common/constants/crm/conversation-query-params";
import type { MessageClientResult } from "@/common/contracts/crm/message-client-result";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
import { versionedJsonMutationService } from "./versioned-json-mutation-service";

const { isRecord, send } = versionedJsonMutationService;

// Chat routes answer errors as `{ code, message }`, not the `{ error }` shape of older routes.
function readErrorCode(payload: unknown): MessageErrorCode {
  return readApiErrorCode(
    payload,
    MESSAGE_ERROR_CODE_VALUES,
    MessageErrorCode.Internal,
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
    : { ok: false, code: readErrorCode(response.payload) };
}

function isConversation<TConversation extends ConversationDto>(
  value: unknown,
): value is TConversation {
  return (
    isRecord(value) &&
    (typeof value.id === "string" || value.id === null) &&
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

/** Loads the newest page, or the page before `cursor`; the endpoint decides whose view it is. */
function getConversation<TConversation extends ConversationDto>(
  endpoint: string,
  cursor: string | null,
): Promise<MessageClientResult<TConversation>> {
  const query = cursor
    ? `?${new URLSearchParams({ [ConversationQueryParam.Cursor]: cursor })}`
    : "";
  return request(`${endpoint}${query}`, HttpMethod.Get, undefined, (payload) =>
    isRecord(payload) && isConversation<TConversation>(payload.conversation)
      ? payload.conversation
      : null,
  );
}

function sendMessage(
  endpoint: string,
  input: SendMessageInput,
): Promise<MessageClientResult<MessageDto>> {
  return request(endpoint, HttpMethod.Post, input, (payload) =>
    isRecord(payload) && isMessage(payload.message) ? payload.message : null,
  );
}

function markRead(
  endpoint: string,
  lastSeenMessageId: string,
): Promise<MessageClientResult<true>> {
  return request(endpoint, HttpMethod.Post, { lastSeenMessageId }, () => true);
}

/** Transport shared by the CRM and the portal conversation services. */
export const conversationApiService = {
  isMessage,
  readErrorCode,
  request,
  getConversation,
  sendMessage,
  markRead,
} as const;
