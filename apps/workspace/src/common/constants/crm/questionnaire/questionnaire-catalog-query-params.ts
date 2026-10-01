export const QuestionnaireCatalogQueryParam = {
  Tab: "tab",
  Status: "status",
  Search: "q",
  Mode: "mode",
} as const;

export type QuestionnaireCatalogQueryParam =
  (typeof QuestionnaireCatalogQueryParam)[keyof typeof QuestionnaireCatalogQueryParam];
