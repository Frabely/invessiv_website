import type { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { CustomerFormValidationCode } from "@/common/constants/crm/forms/customer-form-validation-codes";

/**
 * Raw dialog state: every text is kept as typed, empty meaning "not set". The request
 * mapping trims and converts, so the user's input is never rewritten while typing.
 */
export type CustomerFormValues = {
  displayName: string;
  companyName: string;
  /** Empty string selects "no category". */
  categoryId: string;
  status: CustomerStatus;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  websiteUrl: string;
  vatId: string;
  /** Euro amount as typed ("95,50"); converted to cents on submit. */
  hourlyRate: string;
  notes: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  contactRoleLabel: string;
  contactPreferredLocale: Locale;
};

export type CustomerFormErrors = Partial<
  Record<keyof CustomerFormValues, CustomerFormValidationCode>
>;
