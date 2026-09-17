import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";

/**
 * Kept as an object from the start so Task 03 can add pagination fields without changing
 * the shape callers already destructure.
 */
export type ListCustomersResult = {
  /** Whether at least one customer exists before applying list filters. */
  hasCustomers: boolean;
  /** Current page after clamping an out-of-range request. */
  page: number;
  /** Fixed number of customer rows requested per page. */
  perPage: number;
  /** Rows on the current page. */
  rows: CustomerSummaryDto[];
  /** Number of customers matching the current list view. */
  total: number;
};
