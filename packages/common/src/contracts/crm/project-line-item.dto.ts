import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";

/**
 * A service that belongs to exactly one project. Title, description, price, pricing mode and
 * interval are a complete snapshot taken when it was assigned; a later catalog change never
 * reaches it. The customer is derived from the project and is deliberately not a field here.
 */
export interface ProjectLineItemDto {
  id: string;
  /** The one project this service belongs to. There is no customer-wide position. */
  projectId: string;
  /** Provenance only — null once the origin template was purged, never a live link to its values. */
  sourceLineItemTemplateId: string | null;
  title: string;
  /** Longer explanation of the scope; empty string, never null, when nothing was filled in. */
  description: string;
  /** Net price in EUR cents, frozen at assignment time and editable per project. */
  priceCents: number;
  pricingMode: ServicePricingMode;
  /** Set only when `pricingMode` is `recurring`, otherwise always null. */
  recurringInterval: BillingInterval | null;
  /** Commercial lifecycle. Only `confirmed` items contribute to project and customer values. */
  status?: ProjectLineItemStatus;
  /** Optimistic-concurrency counter; every update request must echo the value it read. */
  version: number;
  createdAt: string;
  updatedAt: string;
}
