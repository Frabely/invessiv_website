import "server-only";

import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CrmOperation } from "@/common/constants/crm/crm-operations";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";

const STATUS: Record<MessageErrorCode, HttpResponseCode> = {
  [MessageErrorCode.NotFound]: HttpResponseCode.NotFound,
  [MessageErrorCode.ValidationError]: HttpResponseCode.BadRequest,
  [MessageErrorCode.Forbidden]: HttpResponseCode.Forbidden,
  [MessageErrorCode.VersionConflict]: HttpResponseCode.Conflict,
  [MessageErrorCode.RateLimited]: HttpResponseCode.TooManyRequests,
  [MessageErrorCode.AttachmentReleaseRequired]: HttpResponseCode.Conflict,
  [MessageErrorCode.AttachmentUnavailable]:
    HttpResponseCode.UnprocessableContent,
  [MessageErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<MessageErrorCode, string> = {
  [MessageErrorCode.NotFound]: "Conversation or message not found.",
  [MessageErrorCode.ValidationError]: "Invalid message request.",
  [MessageErrorCode.Forbidden]: "This action is not permitted.",
  [MessageErrorCode.VersionConflict]: "Conversation was changed.",
  [MessageErrorCode.RateLimited]: "Too many messages. Try again later.",
  [MessageErrorCode.AttachmentReleaseRequired]:
    "An attachment is internal and must be released to the customer.",
  [MessageErrorCode.AttachmentUnavailable]:
    "An attachment cannot be shared with the customer.",
  [MessageErrorCode.Internal]: "Messages are temporarily unavailable.",
};

/** Chat routes answer `{ code, message }`; a rate limit adds `Retry-After`. */
export function messageApiError(
  code: MessageErrorCode,
  retryAfterSeconds: number | null = null,
): Response {
  return Response.json(
    { code, message: MESSAGES[code] },
    {
      status: STATUS[code],
      headers:
        retryAfterSeconds === null
          ? undefined
          : { [HttpHeaderName.RetryAfter]: String(retryAfterSeconds) },
    },
  );
}

/** Logs an unexpected failure without request content and answers it as `internal`. */
export function messageApiFailure(
  operation: CrmOperation,
  error: unknown,
): Response {
  logCrmFailure(operation, error);
  return messageApiError(MessageErrorCode.Internal);
}
