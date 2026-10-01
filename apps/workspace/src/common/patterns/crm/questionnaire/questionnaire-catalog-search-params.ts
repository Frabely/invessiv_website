import { QuestionnaireCatalogQueryParam } from "@/common/constants/crm/questionnaire/questionnaire-catalog-query-params";
import {
  QUESTIONNAIRE_CATALOG_STATUS_FILTER_VALUES,
  QuestionnaireCatalogStatusFilter,
} from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import {
  QUESTIONNAIRE_CATALOG_TAB_VALUES,
  QuestionnaireCatalogTab,
} from "@/common/constants/crm/questionnaire/questionnaire-catalog-tabs";
import type { QuestionnaireCatalogFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-filters";
import {
  type ListSearchParamsInput,
  readListSearchParam,
} from "@/common/patterns/crm/list-search-params-primitives";

const SEARCH_MAX_LENGTH = 100;

function oneOf<T extends string>(
  values: readonly T[],
  value: string | undefined,
  fallback: T,
): T {
  return values.find((candidate) => candidate === value) ?? fallback;
}

/** Unknown values fall back to the defaults instead of failing, so an old link still opens. */
export function parseQuestionnaireCatalogFilters(
  searchParams: ListSearchParamsInput,
): QuestionnaireCatalogFilters {
  const read = (param: QuestionnaireCatalogQueryParam) =>
    readListSearchParam(searchParams[param]);
  return {
    tab: oneOf(
      QUESTIONNAIRE_CATALOG_TAB_VALUES,
      read(QuestionnaireCatalogQueryParam.Tab),
      QuestionnaireCatalogTab.Blocks,
    ),
    status: oneOf(
      QUESTIONNAIRE_CATALOG_STATUS_FILTER_VALUES,
      read(QuestionnaireCatalogQueryParam.Status),
      QuestionnaireCatalogStatusFilter.Active,
    ),
    search: (read(QuestionnaireCatalogQueryParam.Search) ?? "")
      .trim()
      .slice(0, SEARCH_MAX_LENGTH),
  };
}

/** Only values that differ from the defaults end up in the URL. */
export function buildQuestionnaireCatalogQueryString(
  filters: QuestionnaireCatalogFilters,
): string {
  const params = new URLSearchParams();
  if (filters.tab !== QuestionnaireCatalogTab.Blocks)
    params.set(QuestionnaireCatalogQueryParam.Tab, filters.tab);
  if (filters.status !== QuestionnaireCatalogStatusFilter.Active)
    params.set(QuestionnaireCatalogQueryParam.Status, filters.status);
  if (filters.search)
    params.set(QuestionnaireCatalogQueryParam.Search, filters.search);
  return params.toString();
}
