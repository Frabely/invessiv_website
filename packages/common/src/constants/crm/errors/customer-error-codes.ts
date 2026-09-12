/**
 * Deliberately without `CompanyNameExists`: duplicate company names are a valid state.
 * Task 04 warns about them but never blocks.
 */
export const CustomerErrorCode = {
  CustomerNotFound: "CUSTOMER_NOT_FOUND",
  ContactNotFound: "CONTACT_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type CustomerErrorCode =
  (typeof CustomerErrorCode)[keyof typeof CustomerErrorCode];

export const CUSTOMER_ERROR_CODE_VALUES = [
  CustomerErrorCode.CustomerNotFound,
  CustomerErrorCode.ContactNotFound,
  CustomerErrorCode.ValidationError,
  CustomerErrorCode.Internal,
] as const;
