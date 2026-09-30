import { OnboardingFieldType } from "./onboarding-field-types";

/** CRM values a field is pre-filled with. Nothing is ever written back from the form into the CRM. */
export const OnboardingPrefillSource = {
  CustomerCompanyName: "customer_company_name",
  CustomerAddress: "customer_address",
  CustomerVatId: "customer_vat_id",
  CustomerWebsiteUrl: "customer_website_url",
  PrimaryContactName: "primary_contact_name",
  PrimaryContactEmail: "primary_contact_email",
  PrimaryContactPhone: "primary_contact_phone",
} as const;

export type OnboardingPrefillSource =
  (typeof OnboardingPrefillSource)[keyof typeof OnboardingPrefillSource];

export const ONBOARDING_PREFILL_SOURCE_VALUES = [
  OnboardingPrefillSource.CustomerCompanyName,
  OnboardingPrefillSource.CustomerAddress,
  OnboardingPrefillSource.CustomerVatId,
  OnboardingPrefillSource.CustomerWebsiteUrl,
  OnboardingPrefillSource.PrimaryContactName,
  OnboardingPrefillSource.PrimaryContactEmail,
  OnboardingPrefillSource.PrimaryContactPhone,
] as const;

/** The one field type each source fits; the field editor offers a source only for that type. */
export const ONBOARDING_PREFILL_SOURCE_FIELD_TYPES = {
  [OnboardingPrefillSource.CustomerCompanyName]: OnboardingFieldType.ShortText,
  [OnboardingPrefillSource.CustomerAddress]: OnboardingFieldType.LongText,
  [OnboardingPrefillSource.CustomerVatId]: OnboardingFieldType.ShortText,
  [OnboardingPrefillSource.CustomerWebsiteUrl]: OnboardingFieldType.Url,
  [OnboardingPrefillSource.PrimaryContactName]: OnboardingFieldType.ShortText,
  [OnboardingPrefillSource.PrimaryContactEmail]: OnboardingFieldType.Email,
  [OnboardingPrefillSource.PrimaryContactPhone]: OnboardingFieldType.Phone,
} as const satisfies Record<OnboardingPrefillSource, OnboardingFieldType>;
