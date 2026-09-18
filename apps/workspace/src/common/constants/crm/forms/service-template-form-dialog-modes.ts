export const ServiceTemplateFormDialogMode = {
  Create: "create",
  Edit: "edit",
} as const;

export type ServiceTemplateFormDialogMode =
  (typeof ServiceTemplateFormDialogMode)[keyof typeof ServiceTemplateFormDialogMode];
