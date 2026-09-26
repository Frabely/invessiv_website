import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const ERROR_RESPONSES = {
  [MessageErrorCode.NotFound]: {
    status: HttpResponseCode.NotFound,
    message: "Conversation or message not found.",
  },
  [MessageErrorCode.ValidationError]: {
    status: HttpResponseCode.BadRequest,
    message: "Invalid message request.",
  },
  [MessageErrorCode.Forbidden]: {
    status: HttpResponseCode.Forbidden,
    message: "This action requires workspace ownership.",
  },
  [MessageErrorCode.VersionConflict]: {
    status: HttpResponseCode.Conflict,
    message: "Conversation was changed.",
  },
  [MessageErrorCode.Internal]: {
    status: HttpResponseCode.InternalServerError,
    message: "Messages are temporarily unavailable.",
  },
} satisfies Record<
  MessageErrorCode,
  { status: HttpResponseCode; message: string }
>;

export function messageApiError(code: MessageErrorCode): Response {
  const { status, message } = ERROR_RESPONSES[code];
  return Response.json({ code, message }, { status });
}
