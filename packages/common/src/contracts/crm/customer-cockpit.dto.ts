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
  /** Hidden for a project-only binding. */
  ownerDisplayName: string | null;
  /** Hidden for a project-only binding. */
  primaryContactName: string | null;
  /** Hidden for a project-only binding, otherwise the primary contact's preferred email. */
  primaryContactEmail: string | null;
}
