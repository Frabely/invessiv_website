import { LineItemTemplateListQueryParam } from "@/common/constants/crm/list/line-item-template-list-query-params";
import type { LineItemTemplateListFilters } from "@/common/contracts/crm/line-item-template-list-filters";

export function buildLineItemTemplateListQueryString(
  filters: LineItemTemplateListFilters,
): string {
  const params = new URLSearchParams();

  if (filters.page > 1) {
    params.set(LineItemTemplateListQueryParam.Page, String(filters.page));
  }
  if (filters.includeArchived) {
    params.set(LineItemTemplateListQueryParam.IncludeArchived, "true");
  }

  return params.toString();
}

export function buildLineItemTemplateListHref(
  basePath: string,
  filters: LineItemTemplateListFilters,
): string {
  const query = buildLineItemTemplateListQueryString(filters);
  return query ? `${basePath}?${query}` : basePath;
}
