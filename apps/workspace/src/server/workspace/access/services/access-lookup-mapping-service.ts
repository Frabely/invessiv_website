import "server-only";

import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { AccessCustomerOptionRow } from "@invessiv/common/contracts/auth/rows/access-customer-option-row";
import type { AccessProjectOptionRow } from "@invessiv/common/contracts/auth/rows/access-project-option-row";

/**
 * Fields are copied one by one instead of spreading the row: the lookup is not scope-filtered,
 * so a wider row must never reach the response by accident.
 */
function mapCustomerRow(row: AccessCustomerOptionRow): AccessCustomerOptionDto {
  return {
    id: row.id,
    customerNumber: row.customer_number,
    displayName: row.display_name,
  };
}

/** Same rule as `mapCustomerRow`: fields are copied individually, never spread. */
function mapProjectRow(row: AccessProjectOptionRow): AccessProjectOptionDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
  };
}

export const accessLookupMappingService = {
  mapCustomerRow,
  mapProjectRow,
} as const;
