/** Archived catalog entries stay readable but drop out of pickers; blocks of a form are never archived. */
export const QuestionnaireCatalogStatus = {
  Active: "active",
  Archived: "archived",
} as const;

export type QuestionnaireCatalogStatus =
  (typeof QuestionnaireCatalogStatus)[keyof typeof QuestionnaireCatalogStatus];

export const QUESTIONNAIRE_CATALOG_STATUS_VALUES = [
  QuestionnaireCatalogStatus.Active,
  QuestionnaireCatalogStatus.Archived,
] as const;
