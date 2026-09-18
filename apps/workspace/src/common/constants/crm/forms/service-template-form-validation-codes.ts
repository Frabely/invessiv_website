export const ServiceTemplateFormValidationCode = {
  TitleRequired: "TITLE_REQUIRED",
  PriceInvalid: "PRICE_INVALID",
  PriceOutOfRange: "PRICE_OUT_OF_RANGE",
  RecurringIntervalRequired: "RECURRING_INTERVAL_REQUIRED",
} as const;

export type ServiceTemplateFormValidationCode =
  (typeof ServiceTemplateFormValidationCode)[keyof typeof ServiceTemplateFormValidationCode];
