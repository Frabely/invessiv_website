import { CustomerSort } from "@invessiv/common/constants/crm/list/customer-sort";
import { CustomerListQueryParam } from "@/common/constants/crm/list/customer-list-query-params";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";

export function buildCustomerListQueryString(
  filters: CustomerListFilters,
): string {
  const params = new URLSearchParams();

  if (filters.page > 1) {
    params.set(CustomerListQueryParam.Page, String(filters.page));
  }
  if (filters.sort !== CustomerSort.UpdatedDesc) {
    params.set(CustomerListQueryParam.Sort, filters.sort);
  }
  if (filters.includeArchived) {
    params.set(CustomerListQueryParam.Archived, "true");
  }
  if (filters.search) {
    params.set(CustomerListQueryParam.Search, filters.search);
  }

  return params.toString();
}

export function buildCustomerListHref(
  basePath: string,
  filters: CustomerListFilters,
): string {
  const query = buildCustomerListQueryString(filters);
  return query ? `${basePath}?${query}` : basePath;
}
