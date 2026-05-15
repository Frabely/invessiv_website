export const CONTACT_FIELD_ERROR_CODE = {
  InvalidEmail: "invalid_email",
  Required: "required",
} as const;

export type ContactFieldErrorCode =
  (typeof CONTACT_FIELD_ERROR_CODE)[keyof typeof CONTACT_FIELD_ERROR_CODE];
