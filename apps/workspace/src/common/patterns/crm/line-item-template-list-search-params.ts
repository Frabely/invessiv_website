import { LineItemTemplateListQueryParam } from "@/common/constants/crm/list/line-item-template-list-query-params";
import type { LineItemTemplateListFilters } from "@/common/contracts/crm/line-item-template-list-filters";
import {
  type ListSearchParamsInput,
  readListPage,
  readListSearchParam,
} from "@/common/patterns/crm/list-search-params-primitives";

export function parseLineItemTemplateListFilters(
  searchParams: ListSearchParamsInput,
): LineItemTemplateListFilters {
  return {
    includeArchived:
      readListSearchParam(
        searchParams[LineItemTemplateListQueryParam.IncludeArchived],
      ) === "true",
    page: readListPage(
      readListSearchParam(searchParams[LineItemTemplateListQueryParam.Page]),
    ),
  };
}
