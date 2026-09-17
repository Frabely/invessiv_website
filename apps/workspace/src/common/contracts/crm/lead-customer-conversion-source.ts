/** Narrow lead projection used to prefill a customer conversion form. */
export type LeadCustomerConversionSource = {
  /** Lead identifier passed to the conversion endpoint. */
  id: string;
  /** Preferred customer display name. */
  displayName: string;
  /** Optional company name copied into the customer draft. */
  companyName: string | null;
  /** Optional active category identifier shared by leads and customers. */
  categoryId: string | null;
  /** Optional website copied into the customer draft. */
  websiteUrl: string | null;
  /** Optional notes copied into the customer draft. */
  notes: string | null;
  /** Optional primary-contact first name. */
  firstName: string | null;
  /** Optional primary-contact last name. */
  lastName: string | null;
  /** Optional primary-contact email address. */
  email: string | null;
  /** Optional primary-contact phone number. */
  phone: string | null;
};
