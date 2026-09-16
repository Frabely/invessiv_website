import { z } from "zod";

import { CustomerFieldLimits } from "@invessiv/common/constants/crm/forms/customer-field-limits";
import { SUPPORTED_LOCALES } from "@invessiv/common/contracts/i18n/locale";
import { formValidationService } from "@invessiv/common/patterns/validation/form-validation-service";
import { formValidationSchemas } from "@invessiv/common/patterns/validation/form-validation-schemas";

function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => value || null);
}

const optionalEmail = optionalText(CustomerFieldLimits.EmailMaxLength).pipe(
  formValidationSchemas.email.nullable(),
);

const optionalPhone = optionalText(CustomerFieldLimits.PhoneMaxLength).refine(
  (value) => value === null || formValidationService.isValidPhone(value),
  { message: "Invalid phone number" },
);

const optionalWebsiteUrl = optionalText(
  CustomerFieldLimits.WebsiteUrlMaxLength,
).pipe(formValidationSchemas.httpUrl.nullable());

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

const contactWriteSchema = primaryContactSchema
  .extend({
    assignmentVersion: z.int().positive().optional(),
    id: z.uuid().optional(),
    isPrimary: z.boolean(),
    personId: z.uuid().optional(),
    personVersion: z.int().positive().optional(),
  })
  .superRefine((contact, context) => {
    const isExisting = Boolean(contact.id);
    if (
      isExisting !== Boolean(contact.personId) ||
      isExisting !== Boolean(contact.assignmentVersion) ||
      isExisting !== Boolean(contact.personVersion)
    ) {
      context.addIssue({
        code: "custom",
        message: "Incomplete contact version",
      });
    }
  });

const writeFieldsSchema = z.object({
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

export const customerSchemas = {
  entityId: z.uuid(),
  create: writeFieldsSchema.extend({ primaryContact: primaryContactSchema }),
  createContact: primaryContactSchema,
  update: writeFieldsSchema.extend({
    version: z.int().positive(),
    contacts: z
      .array(contactWriteSchema)
      .min(1)
      .optional()
      .superRefine((contacts, context) => {
        if (
          !contacts ||
          contacts.filter((contact) => contact.isPrimary).length === 1
        ) {
          return;
        }
        context.addIssue({
          code: "custom",
          message: "Exactly one primary contact is required",
        });
      }),
  }),
} as const;
