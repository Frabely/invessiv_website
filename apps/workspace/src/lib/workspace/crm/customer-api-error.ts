import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<CustomerErrorCode, HttpResponseCode> = {
  [CustomerErrorCode.CustomerNotFound]: HttpResponseCode.NotFound,
  [CustomerErrorCode.ContactNotFound]: HttpResponseCode.NotFound,
  [CustomerErrorCode.DisplayNameTaken]: HttpResponseCode.Conflict,
  [CustomerErrorCode.OwnerInactive]: HttpResponseCode.Conflict,
  [CustomerErrorCode.ValidationError]: HttpResponseCode.UnprocessableContent,
  [CustomerErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<CustomerErrorCode, string> = {
  [CustomerErrorCode.CustomerNotFound]: "Customer not found",
  [CustomerErrorCode.ContactNotFound]: "Contact not found",
  [CustomerErrorCode.DisplayNameTaken]:
    "A customer with this display name already exists",
  [CustomerErrorCode.OwnerInactive]: "The owner is no longer an active member",
  [CustomerErrorCode.ValidationError]: "Validation failed",
  [CustomerErrorCode.Internal]: "Unexpected server error",
};

/** `status` only overrides the mapping for a body that is not JSON at all (400 instead of 422). */
export function customerApiError(
  code: CustomerErrorCode,
  options: { details?: unknown; status?: HttpResponseCode } = {},
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(options.details !== undefined ? { details: options.details } : {}),
    },
    { status: options.status ?? STATUS[code] },
  );
}
