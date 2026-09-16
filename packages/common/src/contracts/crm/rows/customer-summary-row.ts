import type { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";

/** Row shapes stay snake_case and carry `Date`; the mapper does the conversion. */
export type CustomerSummaryRow = {
  id: string;
  customer_number: number;
  display_name: string;
  company_name: string | null;
  status: CustomerStatus;
  owner_member_id: string;
  category_id: string | null;
  city: string | null;
  created_at: Date;
  updated_at: Date;
};
