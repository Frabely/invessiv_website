export const ContactFormSubmitErrorType = {
  Delivery: "delivery",
  Generic: "generic",
  RateLimited: "rate_limited",
  Validation: "validation",
} as const;

export type ContactFormSubmitErrorType =
  (typeof ContactFormSubmitErrorType)[keyof typeof ContactFormSubmitErrorType];
