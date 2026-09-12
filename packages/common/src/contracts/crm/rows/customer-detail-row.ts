import type { CustomerSummaryRow } from "./customer-summary-row";

/** Everything the list query omits, plus `version` for the write path. */
export type CustomerDetailRow = CustomerSummaryRow & {
  street: string | null;
  postal_code: string | null;
  country: string | null;
  website_url: string | null;
  vat_id: string | null;
  notes: string | null;
  default_hourly_rate_cents: number | null;
  retention_review_after_days: number | null;
  version: number;
};
