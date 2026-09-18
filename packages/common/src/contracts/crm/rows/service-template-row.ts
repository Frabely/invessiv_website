import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";

/** Direct mirror of the `service_templates` row shape as Drizzle returns it. */
export interface ServiceTemplateRow {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  pricing_mode: ServicePricingMode;
  recurring_interval: BillingInterval | null;
  status: ServiceTemplateStatus;
  version: number;
  created_at: Date;
  updated_at: Date;
}
