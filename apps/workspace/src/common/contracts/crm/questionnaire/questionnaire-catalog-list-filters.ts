import type { QuestionnaireCatalogStatusFilter } from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";

/** Filters both catalog lists share; the query handlers take exactly this. */
export type QuestionnaireCatalogListFilters = {
  status: QuestionnaireCatalogStatusFilter;
  /** Trimmed free text; empty means no search. */
  search: string;
};
