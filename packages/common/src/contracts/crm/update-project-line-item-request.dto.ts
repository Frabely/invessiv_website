import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";

/** The origin template is immutable provenance and therefore not part of an update. */
export interface UpdateProjectLineItemRequestDto {
  title: string;
  description: string;
  priceCents: number;
  pricingMode: ServicePricingMode;
  /** Required exactly when `pricingMode` is `recurring`; must stay null otherwise. */
  recurringInterval: BillingInterval | null;
  /** Value the client last read; a stale value answers with a 409 version conflict. */
  version: number;
}
