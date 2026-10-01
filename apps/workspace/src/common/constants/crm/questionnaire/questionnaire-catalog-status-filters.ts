/** The list filter; `all` is no stored status, so it is its own union and not `QuestionnaireCatalogStatus`. */
export const QuestionnaireCatalogStatusFilter = {
  Active: "active",
  Archived: "archived",
  All: "all",
} as const;

export type QuestionnaireCatalogStatusFilter =
  (typeof QuestionnaireCatalogStatusFilter)[keyof typeof QuestionnaireCatalogStatusFilter];

export const QUESTIONNAIRE_CATALOG_STATUS_FILTER_VALUES = [
  QuestionnaireCatalogStatusFilter.Active,
  QuestionnaireCatalogStatusFilter.Archived,
  QuestionnaireCatalogStatusFilter.All,
] as const;
