export const CONTACT_FIELD_ERROR_CODE = {
  ConsentRequired: "consent_required",
  InvalidEmail: "invalid_email",
  InvalidUrl: "invalid_url",
  Required: "required",
} as const;

export type ContactFieldErrorCode =
  (typeof CONTACT_FIELD_ERROR_CODE)[keyof typeof CONTACT_FIELD_ERROR_CODE];
