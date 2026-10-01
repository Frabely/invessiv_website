/** Dialogs of the catalog block page itself, outside the owner-neutral editor. */
export const QuestionnaireBlockPageDialog = {
  Duplicate: "duplicate",
  Delete: "delete",
} as const;

export type QuestionnaireBlockPageDialog =
  (typeof QuestionnaireBlockPageDialog)[keyof typeof QuestionnaireBlockPageDialog];

export const QUESTIONNAIRE_BLOCK_PAGE_DIALOG_VALUES = [
  QuestionnaireBlockPageDialog.Duplicate,
  QuestionnaireBlockPageDialog.Delete,
] as const;
