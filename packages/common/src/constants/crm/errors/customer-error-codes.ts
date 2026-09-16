/**
 * Deliberately without `CompanyNameExists`: duplicate company names are a valid state.
 * The normalized display name is unique instead (`DisplayNameTaken`).
 */
export const CustomerErrorCode = {
  CustomerNotFound: "CUSTOMER_NOT_FOUND",
  ContactNotFound: "CONTACT_NOT_FOUND",
  DisplayNameTaken: "CUSTOMER_DISPLAY_NAME_TAKEN",
  OwnerInactive: "CUSTOMER_OWNER_INACTIVE",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type CustomerErrorCode =
  (typeof CustomerErrorCode)[keyof typeof CustomerErrorCode];

export const CUSTOMER_ERROR_CODE_VALUES = [
  CustomerErrorCode.CustomerNotFound,
  CustomerErrorCode.ContactNotFound,
  CustomerErrorCode.DisplayNameTaken,
  CustomerErrorCode.OwnerInactive,
  CustomerErrorCode.ValidationError,
  CustomerErrorCode.Internal,
] as const;
