import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";

/** A created template always starts `active`; there is no way to create it archived. */
export interface CreateServiceTemplateRequestDto {
  /** Short catalog name shown in the picker when assigning a project service. */
  title: string;
  /** Longer explanation of the service scope; an empty string is valid. */
  description: string;
  /** Net price in EUR cents. */
  priceCents: number;
  /** How the price applies: a one-off amount, a recurring charge, or an hourly rate. */
  pricingMode: ServicePricingMode;
  /** Required exactly when `pricingMode` is `recurring`; must stay null otherwise. */
  recurringInterval: BillingInterval | null;
}
