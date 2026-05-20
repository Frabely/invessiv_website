import type { ContactSubmitErrorCode } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";

export type ContactValidationSuccess<TData> = {
  data: TData;
  ok: true;
};

export type ContactValidationFailure = {
  code: Extract<ContactSubmitErrorCode, "spam_detected" | "validation_error">;
  fieldErrors: Record<string, string[]>;
  ok: false;
};

export type ContactValidationResult<TData> =
  | ContactValidationSuccess<TData>
  | ContactValidationFailure;
