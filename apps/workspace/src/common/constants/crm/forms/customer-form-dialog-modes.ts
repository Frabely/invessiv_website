export const CustomerFormDialogMode = {
  Create: "create",
  Edit: "edit",
} as const;

export type CustomerFormDialogMode =
  (typeof CustomerFormDialogMode)[keyof typeof CustomerFormDialogMode];

export const CUSTOMER_FORM_DIALOG_MODE_VALUES = [
  CustomerFormDialogMode.Create,
  CustomerFormDialogMode.Edit,
] as const;
