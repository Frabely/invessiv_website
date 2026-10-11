import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";

/**
 * The first build assigns from the catalog only: `sourceLineItemTemplateId` must name an active
 * template. The other fields are the snapshot, pre-filled from that template and adjustable
 * before saving.
 */
export interface CreateProjectLineItemRequestDto {
  /** Active source for this snapshot. */
  sourceLineItemTemplateId: string;
  /** Selected catalog version; omitted only by clients deployed before replay protection. */
  sourceLineItemTemplateVersion?: number;
  /** Stable per assignment attempt; also used as the new line item ID. */
  idempotencyKey?: string;
  /** Project-specific title copied from the selected template and editable before assigning. */
  title: string;
  /** Project-specific scope description, independent of subsequent catalog changes. */
  description: string;
  /** Price in whole cents; an hourly rate for purchased hours. */
  priceCents: number;
  /** Billing mode of the snapshot; automated kinds require their matching mode. */
  pricingMode: ServicePricingMode;
  /** Required exactly when `pricingMode` is `recurring`; must stay null otherwise. */
  recurringInterval: BillingInterval | null;
  /** Standard snapshots default to planned; automated kinds always become confirmed. */
  status?: ProjectLineItemStatus;
  /** Required for a template of kind `hours` (multiple of 15); must be null or absent for every other kind. */
  quantityMinutes?: number | null;
  /**
   * Only read for kind `hours`. True or absent allocates the purchased hours to this project;
   * false credits them to the customer and leaves them free for any project.
   */
  allocateHoursToProject?: boolean;
}
