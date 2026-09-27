import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
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
  [MessageErrorCode.RateLimited]: {
    status: HttpResponseCode.TooManyRequests,
    message: "Too many messages. Try again later.",
  },
  [MessageErrorCode.Internal]: {
    status: HttpResponseCode.InternalServerError,
    message: "Messages are temporarily unavailable.",
  },
} satisfies Record<
  MessageErrorCode,
  { status: HttpResponseCode; message: string }
>;

export function messageApiError(
  code: MessageErrorCode,
  retryAfterSeconds: number | null = null,
): Response {
  const { status, message } = ERROR_RESPONSES[code];
  return Response.json(
    { code, message },
    {
      status,
      headers:
        retryAfterSeconds === null
          ? undefined
          : { [HttpHeaderName.RetryAfter]: String(retryAfterSeconds) },
    },
  );
}
