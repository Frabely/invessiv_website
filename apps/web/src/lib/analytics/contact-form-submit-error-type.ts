import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";

export const ContactFormSubmitErrorType = {
  Delivery: "delivery",
  Generic: "generic",
  RateLimited: CONTACT_SUBMIT_ERROR_CODE.RateLimited,
  Validation: "validation",
} as const;

export type ContactFormSubmitErrorType =
  (typeof ContactFormSubmitErrorType)[keyof typeof ContactFormSubmitErrorType];
