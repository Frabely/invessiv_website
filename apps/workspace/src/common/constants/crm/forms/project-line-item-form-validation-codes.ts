/** The one rule the shared snapshot form does not cover: this build assigns from the catalog only. */
export const ProjectLineItemFormValidationCode = {
  TemplateRequired: "TEMPLATE_REQUIRED",
} as const;

export type ProjectLineItemFormValidationCode =
  (typeof ProjectLineItemFormValidationCode)[keyof typeof ProjectLineItemFormValidationCode];
