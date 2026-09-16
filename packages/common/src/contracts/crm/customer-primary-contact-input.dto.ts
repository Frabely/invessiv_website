import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/**
 * The primary contact created together with a customer. It always becomes a new global
 * person; linking an existing person needs the person search of Task 06.
 */
export interface CustomerPrimaryContactInputDto {
  /** Optional; combined with `lastName` into the person's display name. */
  firstName: string | null;
  /** Required for new writes; nullable in the contract to represent historical records. */
  lastName: string | null;
  /** Stored as the person's own address. Never used for authorization. */
  email: string | null;
  /** Stored as the person's own phone number. */
  phone: string | null;
  /** Free-text role at this customer; stored on the assignment, not on the person. */
  roleLabel: string | null;
  /** Portal and mail language of the person, follows it across every customer. */
  preferredLocale: Locale;
}
