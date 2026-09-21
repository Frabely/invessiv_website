export const LineItemTemplateFormDialogMode = {
  Create: "create",
  Edit: "edit",
} as const;

export type LineItemTemplateFormDialogMode =
  (typeof LineItemTemplateFormDialogMode)[keyof typeof LineItemTemplateFormDialogMode];
