import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";

/** Direct mirror of the `project_line_items` row shape as Drizzle returns it. */
export interface ProjectLineItemRow {
  id: string;
  project_id: string;
  source_line_item_template_id: string | null;
  title: string;
  description: string;
  price_cents: number;
  pricing_mode: ServicePricingMode;
  recurring_interval: BillingInterval | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}
