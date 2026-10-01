/** Dialogs of the catalog page; the value sits in the `mode` query param. */
export const QuestionnaireCatalogDialogMode = {
  CreateBlock: "create-block",
  CreateTemplate: "create-template",
} as const;

export type QuestionnaireCatalogDialogMode =
  (typeof QuestionnaireCatalogDialogMode)[keyof typeof QuestionnaireCatalogDialogMode];

export const QUESTIONNAIRE_CATALOG_DIALOG_MODE_VALUES = [
  QuestionnaireCatalogDialogMode.CreateBlock,
  QuestionnaireCatalogDialogMode.CreateTemplate,
] as const;
