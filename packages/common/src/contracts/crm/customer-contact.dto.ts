import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/**
 * Assignment of a global person to a customer. `personId` points at the person; the
 * business contact details and the role belong to the assignment.
 */
export interface CustomerContactAssignmentDto {
  /** Id of the assignment, not of the person. Mutations address this value. */
  id: string;
  /** The global person behind the assignment. The same person may serve several customers. */
  personId: string;
  /**
   * Resolved display name of the person, derived from first and last name and falling
   * back to the email. Always present — prefer it over recomposing the name parts.
   */
  displayName: string;
  /**
   * Source for `displayName`. Nullable: a contact reached only by a company address
   * may have no known first name.
   */
  firstName: string | null;
  /**
   * Source for `displayName`. Nullable for the same reason as `firstName`; neither part
   * is required, which is why `displayName` exists as the reliable field.
   */
  lastName: string | null;
  /**
   * The person's own address, independent of any customer. Never used for
   * authorization — portal access is bound to a redeemed invitation, not to an email.
   */
  primaryEmail: string | null;
  /** The person's own phone number, independent of any customer. */
  primaryPhone: string | null;
  /**
   * Differing business address for this customer only. Takes precedence over
   * `primaryEmail` wherever a single contact address is shown.
   */
  businessEmail: string | null;
  /** Differing business phone number for this customer only. */
  businessPhone: string | null;
  /** Free-text role at this customer ("Geschäftsführung", "Marketing"). No fixed list. */
  roleLabel: string | null;
  /**
   * Exactly one assignment per customer carries this flag. The database enforces at
   * most one, the atomic create command at least one.
   */
  isPrimary: boolean;
  /**
   * Portal language of the person, not of the assignment: it follows the person across
   * every customer, and it is the locale system mails are rendered in.
   */
  preferredLocale: Locale;
  /** Version of the customer-specific assignment fields such as role and business email. */
  assignmentVersion: number;
  /** Version of the global person fields shared across every customer assignment. */
  personVersion: number;
  /** ISO string of the assignment creation time, never a `Date`. */
  createdAt: string;
  /** ISO string of the assignment update time. */
  updatedAt: string;
}
