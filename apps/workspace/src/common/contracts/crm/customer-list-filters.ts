import type { CustomerSort } from "@invessiv/common/constants/crm/list/customer-sort";

export type CustomerListFilters = {
  includeArchived: boolean;
  page: number;
  search: string;
  sort: CustomerSort;
};
