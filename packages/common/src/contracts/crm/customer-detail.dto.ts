import type { VersionedDto } from "@invessiv/common/contracts/concurrency/versioned";
import type { CustomerContactAssignmentDto } from "@invessiv/common/contracts/crm/customer-contact.dto";
import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";

/**
 * The full customer record. Everything the summary omits because a list does not need
 * it — plus `version`, because only the detail view writes.
 */
export interface CustomerDetailDto extends CustomerSummaryDto, VersionedDto {
  /** Part of the single billing address kept as columns on the customer. */
  street: string | null;
  /** Part of the billing address. Not validated against a country format. */
  postalCode: string | null;
  /** ISO country code. `city` is duplicated into the summary, this is not. */
  country: string | null;
  /**
   * The customer's own site. Stored as entered, not normalized — the duplicate warning
   * in Task 04 normalizes the domain for comparison instead.
   */
  websiteUrl: string | null;
  /** Not unique: the UI only warns about possible duplicates, it never blocks. */
  vatId: string | null;
  /** Internal free text. Never reaches the portal. */
  notes: string | null;
  /**
   * Default rate for new projects of this customer, in EUR cents. A project may
   * override it. Never portal-visible.
   */
  defaultHourlyRateCents: number | null;
  /**
   * Individual retention review period in days, overriding the defaults (180 for
   * paused, 90 for archived). Only ever proposes a manual review — nothing is deleted
   * automatically.
   */
  retentionReviewAfterDays: number | null;
  /**
   * All contact assignments, the primary one included. Exactly one entry carries
   * `isPrimary`; the order is not guaranteed, so select by the flag.
   */
  contacts: CustomerContactAssignmentDto[];
}
