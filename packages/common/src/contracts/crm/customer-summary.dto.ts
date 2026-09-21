import type { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import type { ProjectLineItemValue } from "@/common/contracts/crm/project-line-item-value";

/**
 * `primaryContactName` is deliberately not nullable: every customer has exactly one
 * primary contact, created atomically with it (Task 04). The email remains nullable
 * because a valid contact may be identified by name and phone only.
 */
export interface CustomerSummaryDto {
  /** Stable uuid. Addressed by every route and mutation; never shown to the user. */
  id: string;
  /**
   * Raw sequence value. Sorting and filtering run on this number — format it to "K0001"
   * with `formatCustomerNumber` only in the view. Gaps are valid and never backfilled.
   */
  customerNumber: number;
  /** The name shown everywhere. Mandatory for both customer types. */
  displayName: string;
  /**
   * Not unique: two genuine "Mueller GmbH" in different cities are a valid state.
   */
  companyName: string | null;
  /** Lifecycle state. `archived` hides the customer from lists but is reversible. */
  status: CustomerStatus;
  /** Null for a project-only binding; the customer itself always has an owner. */
  ownerMemberId: string | null;
  /** Hidden for a project-only binding so the customer header reveals no ownership data. */
  ownerDisplayName: string | null;
  /** Shared vocabulary with the leads area (`lead_categories`), so a conversion keeps it. */
  categoryId: string | null;
  /** Denormalized from the address so lists can show a location without a join. */
  city: string | null;
  /** Hidden for a project-only binding; every fully readable customer has one primary contact. */
  primaryContactName: string | null;
  /**
   * Hidden for a project-only binding; otherwise the business address wins over the personal one.
   */
  primaryContactEmail: string | null;
  /** ISO string, never a `Date` — the mapper converts at the boundary. */
  createdAt: string;
  /** ISO string. Bumped by every versioned customer update. */
  updatedAt: string;
  /** Absent unless the actor may read project line items for this customer. */
  projectLineItemValue?: ProjectLineItemValue;
}
