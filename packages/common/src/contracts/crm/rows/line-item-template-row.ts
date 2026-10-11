import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
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
  /** Null on rows written before kinds existed; read as `standard`. */
  kind: LineItemKind | null;
  /** Null reads as `existing_project`. */
  project_mode: LineItemProjectMode | null;
  /** Null reads as not released. */
  portal_requestable: boolean | null;
  portal_description: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}
