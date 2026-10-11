import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";

export type AssignmentFields = {
  title: string;
  description: string;
  priceCents: number;
  pricingMode: ServicePricingMode;
  recurringInterval: BillingInterval | null;
  status: ProjectLineItemStatus;
  quantityMinutes: number | null;
  /** Hours only: allocate the purchase to the project, or leave it in the customer's free stock. */
  allocateHoursToProject: boolean;
};
