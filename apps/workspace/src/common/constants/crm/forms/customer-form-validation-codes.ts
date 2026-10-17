/** Each value is also the message key in the CRM form dictionary's `validation` block. */
export const CustomerFormValidationCode = {
  DisplayNameRequired: "displayNameRequired",
  CustomerNumberInvalid: "customerNumberInvalid",
  ContactLastNameRequired: "contactLastNameRequired",
  EmailInvalid: "emailInvalid",
  PhoneInvalid: "phoneInvalid",
  UrlInvalid: "urlInvalid",
  HourlyRateInvalid: "hourlyRateInvalid",
} as const;

export type CustomerFormValidationCode =
  (typeof CustomerFormValidationCode)[keyof typeof CustomerFormValidationCode];

export const CUSTOMER_FORM_VALIDATION_CODE_VALUES = [
  CustomerFormValidationCode.DisplayNameRequired,
  CustomerFormValidationCode.CustomerNumberInvalid,
  CustomerFormValidationCode.ContactLastNameRequired,
  CustomerFormValidationCode.EmailInvalid,
  CustomerFormValidationCode.PhoneInvalid,
  CustomerFormValidationCode.UrlInvalid,
  CustomerFormValidationCode.HourlyRateInvalid,
] as const;
