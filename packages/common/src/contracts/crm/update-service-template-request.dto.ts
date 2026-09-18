import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";

export interface UpdateServiceTemplateRequestDto {
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
  /** Archiving hides the template from new-assignment pickers without deleting it. */
  status: ServiceTemplateStatus;
  /** Value the client last read; a stale value answers with a 409 version conflict. */
  version: number;
}
