export const LeadFormDialogMode = {
  Create: "create",
  Edit: "edit",
} as const;

export type LeadFormDialogMode =
  (typeof LeadFormDialogMode)[keyof typeof LeadFormDialogMode];
