import {
  CUSTOMER_SORT_VALUES,
  CustomerSort,
} from "@invessiv/common/constants/crm/list/customer-sort";
import { CustomerListQueryParam } from "@/common/constants/crm/list/customer-list-query-params";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";
import {
  type ListSearchParamsInput,
  readListPage,
  readListSearchParam,
} from "@/common/patterns/crm/list-search-params-primitives";

export function parseCustomerListFilters(
  searchParams: ListSearchParamsInput,
): CustomerListFilters {
  const requestedSort = readListSearchParam(
    searchParams[CustomerListQueryParam.Sort],
  );
  const search = readListSearchParam(
    searchParams[CustomerListQueryParam.Search],
  );

  return {
    includeArchived:
      readListSearchParam(searchParams[CustomerListQueryParam.Archived]) ===
      "true",
    page: readListPage(
      readListSearchParam(searchParams[CustomerListQueryParam.Page]),
    ),
    search: search?.trim() ?? "",
    sort:
      CUSTOMER_SORT_VALUES.find((value) => value === requestedSort) ??
      CustomerSort.UpdatedDesc,
  };
}
