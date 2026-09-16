/**
 * Customer fields shared by create and update. Status and owner are deliberately absent:
 * a new customer is `active` and owned by its creator, and both change only through their
 * own commands (archive/reactivate, owner handover).
 */
export interface CustomerWriteFieldsDto {
  /**
   * Trimmed before storing. Unique across all statuses after lowercasing — a taken name
   * answers `CUSTOMER_DISPLAY_NAME_TAKEN` instead of creating a second record.
   */
  displayName: string;
  /** Null when no separate legal name is needed. */
  companyName: string | null;
  /** Id of an active `lead_categories` row. An unknown or inactive id is a validation error. */
  categoryId: string | null;
  /** Part of the single billing address kept on the customer. */
  street: string | null;
  /** Not validated against a country format. */
  postalCode: string | null;
  /** Shown in lists, so it is the one address part worth filling early. */
  city: string | null;
  /** Free text as entered; not normalized to a code. */
  country: string | null;
  /** Must be an absolute URL. Stored as entered, not normalized. */
  websiteUrl: string | null;
  /** Not unique and not validated against a registry. */
  vatId: string | null;
  /** Internal free text. Never reaches the portal. */
  notes: string | null;
  /** EUR cents, never a decimal amount. The dialog converts the euro input before sending. */
  defaultHourlyRateCents: number | null;
}
