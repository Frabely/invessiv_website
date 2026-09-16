import type { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";

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
  /**
   * The internal member responsible. Mandatory — a customer is never unowned. On an
   * owner handover all open projects, tasks and renewals move along atomically.
   */
  ownerMemberId: string;
  /** Shared vocabulary with the leads area (`lead_categories`), so a conversion keeps it. */
  categoryId: string | null;
  /** Denormalized from the address so lists can show a location without a join. */
  city: string | null;
  /**
   * Display name of the primary contact. Non-nullable by contract — see the note above.
   */
  primaryContactName: string;
  /**
   * Business address of the primary contact, falling back to the personal one. Null
   * when neither exists; never used for authorization.
   */
  primaryContactEmail: string | null;
  /** ISO string, never a `Date` — the mapper converts at the boundary. */
  createdAt: string;
  /** ISO string. Bumped by `updateVersioned` together with `version`. */
  updatedAt: string;
}
