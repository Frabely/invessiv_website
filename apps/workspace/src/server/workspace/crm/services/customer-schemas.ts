import { z } from "zod";

import {
  CUSTOMER_TYPE_VALUES,
  CustomerType,
} from "@invessiv/common/constants/crm/customer-types";
import { CustomerFieldLimits } from "@invessiv/common/constants/crm/forms/customer-field-limits";
import { SUPPORTED_LOCALES } from "@invessiv/common/contracts/i18n/locale";
import { isValidContactPhone } from "@invessiv/common/patterns/contact/contact-phone";

function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => value || null);
}

const optionalEmail = optionalText(CustomerFieldLimits.EmailMaxLength).pipe(
  z.email().nullable(),
);

const optionalPhone = optionalText(CustomerFieldLimits.PhoneMaxLength).refine(
  (value) => value === null || isValidContactPhone(value),
  { message: "Invalid phone number" },
);

const optionalWebsiteUrl = optionalText(
  CustomerFieldLimits.WebsiteUrlMaxLength,
).pipe(z.url({ protocol: /^https?$/ }).nullable());

const primaryContactSchema = z
  .object({
    firstName: optionalText(CustomerFieldLimits.PersonNameMaxLength),
    lastName: optionalText(CustomerFieldLimits.PersonNameMaxLength),
    email: optionalEmail,
    phone: optionalPhone,
    roleLabel: optionalText(CustomerFieldLimits.RoleLabelMaxLength),
    preferredLocale: z.enum(SUPPORTED_LOCALES),
  })
  .refine((contact) => contact.lastName !== null || contact.email !== null, {
    message: "Last name or email is required",
    path: ["lastName"],
  });

const writeFieldsSchema = z.object({
  customerType: z.enum(CUSTOMER_TYPE_VALUES),
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(CustomerFieldLimits.DisplayNameMaxLength),
  companyName: optionalText(CustomerFieldLimits.CompanyNameMaxLength),
  categoryId: z
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  street: optionalText(CustomerFieldLimits.StreetMaxLength),
  postalCode: optionalText(CustomerFieldLimits.PostalCodeMaxLength),
  city: optionalText(CustomerFieldLimits.CityMaxLength),
  country: optionalText(CustomerFieldLimits.CountryMaxLength),
  websiteUrl: optionalWebsiteUrl,
  vatId: optionalText(CustomerFieldLimits.VatIdMaxLength),
  notes: optionalText(CustomerFieldLimits.NotesMaxLength),
  defaultHourlyRateCents: z
    .int()
    .min(0)
    .max(CustomerFieldLimits.HourlyRateCentsMax)
    .nullish()
    .transform((value) => value ?? null),
});

// An individual has no company, so a stale company name from a type switch is dropped.
function dropCompanyNameForIndividuals<
  T extends { customerType: CustomerType; companyName: string | null },
>(fields: T): T {
  return fields.customerType === CustomerType.Individual
    ? { ...fields, companyName: null }
    : fields;
}

export const customerSchemas = {
  entityId: z.uuid(),
  create: writeFieldsSchema
    .extend({ primaryContact: primaryContactSchema })
    .transform(dropCompanyNameForIndividuals),
  update: writeFieldsSchema
    .extend({ version: z.int().positive() })
    .transform(dropCompanyNameForIndividuals),
} as const;
