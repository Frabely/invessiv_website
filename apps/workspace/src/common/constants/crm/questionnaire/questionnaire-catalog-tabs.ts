export const QuestionnaireCatalogTab = {
  Blocks: "blocks",
  Templates: "templates",
} as const;

export type QuestionnaireCatalogTab =
  (typeof QuestionnaireCatalogTab)[keyof typeof QuestionnaireCatalogTab];

export const QUESTIONNAIRE_CATALOG_TAB_VALUES = [
  QuestionnaireCatalogTab.Blocks,
  QuestionnaireCatalogTab.Templates,
] as const;
