import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";

/**
 * The first build assigns from the catalog only: `sourceLineItemTemplateId` must name an active
 * template. The other fields are the snapshot, pre-filled from that template and adjustable
 * before saving.
 */
export interface CreateProjectLineItemRequestDto {
  sourceLineItemTemplateId: string;
  title: string;
  description: string;
  priceCents: number;
  pricingMode: ServicePricingMode;
  /** Required exactly when `pricingMode` is `recurring`; must stay null otherwise. */
  recurringInterval: BillingInterval | null;
  status?: ProjectLineItemStatus;
  /** Required for a template of kind `hours` (multiple of 15); must be null or absent for every other kind. */
  quantityMinutes?: number | null;
  /**
   * Only read for kind `hours`. True or absent allocates the purchased hours to this project;
   * false credits them to the customer and leaves them free for any project.
   */
  allocateHoursToProject?: boolean;
}
