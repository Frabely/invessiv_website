import {
  CUSTOMER_SORT_VALUES,
  CustomerSort,
} from "@invessiv/common/constants/crm/list/customer-sort";
import { CustomerListQueryParam } from "@/common/constants/crm/list/customer-list-query-params";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function readSingle(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readPage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function parseCustomerListFilters(
  searchParams: SearchParamsInput,
): CustomerListFilters {
  const requestedSort = readSingle(searchParams[CustomerListQueryParam.Sort]);

  return {
    includeArchived:
      readSingle(searchParams[CustomerListQueryParam.Archived]) === "true",
    page: readPage(readSingle(searchParams[CustomerListQueryParam.Page])),
    sort:
      CUSTOMER_SORT_VALUES.find((value) => value === requestedSort) ??
      CustomerSort.UpdatedDesc,
  };
}
