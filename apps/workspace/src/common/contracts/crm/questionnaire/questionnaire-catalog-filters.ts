import type { QuestionnaireCatalogTab } from "@/common/constants/crm/questionnaire/questionnaire-catalog-tabs";
import type { QuestionnaireCatalogListFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-list-filters";

/** The URL state of the catalog page: the open tab and the filters of its list. */
export type QuestionnaireCatalogFilters = QuestionnaireCatalogListFilters & {
  tab: QuestionnaireCatalogTab;
};
