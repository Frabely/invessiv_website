import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";

/** Direct mirror of the `line_item_templates` row shape as Drizzle returns it. */
export interface LineItemTemplateRow {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  pricing_mode: ServicePricingMode;
  recurring_interval: BillingInterval | null;
  status: LineItemTemplateStatus;
  version: number;
  created_at: Date;
  updated_at: Date;
}
