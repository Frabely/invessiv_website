export const ServiceTemplateFormValidationCode = {
  TitleRequired: "TITLE_REQUIRED",
  PriceInvalid: "PRICE_INVALID",
} as const;

export type ServiceTemplateFormValidationCode =
  (typeof ServiceTemplateFormValidationCode)[keyof typeof ServiceTemplateFormValidationCode];
