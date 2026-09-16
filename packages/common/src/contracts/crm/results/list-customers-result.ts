import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";

/**
 * Kept as an object from the start so Task 03 can add pagination fields without changing
 * the shape callers already destructure.
 */
export type ListCustomersResult = {
  rows: CustomerSummaryDto[];
};
