/** The one rule the shared snapshot form does not cover: a released template needs its customer text. */
export const LineItemTemplateFormValidationCode = {
  PortalDescriptionRequired: "PORTAL_DESCRIPTION_REQUIRED",
} as const;

export type LineItemTemplateFormValidationCode =
  (typeof LineItemTemplateFormValidationCode)[keyof typeof LineItemTemplateFormValidationCode];
