/** Shared by the server schema and the dialog's `maxLength`, so both reject the same input. */
export const ServiceTemplateFieldLimits = {
  TitleMaxLength: 200,
  DescriptionMaxLength: 4000,
} as const;

export type ServiceTemplateFieldLimit =
  (typeof ServiceTemplateFieldLimits)[keyof typeof ServiceTemplateFieldLimits];
