import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
export interface AcceptServiceRequestLineItemDto {
  /** Assigned snapshot title. */
  title: string;
  /** Assigned snapshot description. */
  description: string;
  /** Price or hourly rate in cents. */
  priceCents: number;
  /** Snapshot billing mode. */
  pricingMode: ServicePricingMode;
  /** Interval exactly for recurring mode. */
  recurringInterval: BillingInterval | null;
  /** Standard service status; automated kinds become confirmed. */
  status: ProjectLineItemStatus;
  /** Minutes for hours, otherwise null. */
  quantityMinutes: number | null;
  /** Allocate purchased hours to the project; false leaves them in free stock. */
  allocateHoursToProject?: boolean;
}
