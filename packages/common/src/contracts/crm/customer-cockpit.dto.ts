import type { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";

/** The intentionally compact read model shared by the CRM dialog and future dashboard view. */
export interface CustomerCockpitDto {
  /** Stable customer identifier used only for navigation and subsequent reads. */
  id: string;
  /** Raw customer sequence number; format it only in the view. */
  customerNumber: number;
  /** Customer name shown in the cockpit heading. */
  displayName: string;
  /** Current customer lifecycle state. */
  status: CustomerStatus;
  /** Display name of the workspace member currently responsible for the customer. */
  ownerDisplayName: string;
  /** Name of the exactly one primary customer contact. */
  primaryContactName: string;
  /** Preferred email address of the primary contact, when one exists. */
  primaryContactEmail: string | null;
}
