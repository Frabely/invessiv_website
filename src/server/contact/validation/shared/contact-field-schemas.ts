import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";

export const optionalTrimmedString = z
  .string()
  .trim()
  .max(500, CONTACT_VALIDATION_FIELD_ERROR_CODE.TooLong)
  .optional()
  .transform((value) => value || undefined);

export const optionalTrimmedStringArray = z
  .array(
    z
      .string()
      .trim()
      .min(1, CONTACT_VALIDATION_FIELD_ERROR_CODE.Required)
      .max(120, CONTACT_VALIDATION_FIELD_ERROR_CODE.TooLong),
  )
  .max(12, CONTACT_VALIDATION_FIELD_ERROR_CODE.TooManyPages)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const isoDateTimeSchema = z
  .string()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    CONTACT_VALIDATION_FIELD_ERROR_CODE.InvalidStartedAt,
  );

export const emailStringSchema = z
  .string()
  .trim()
  .pipe(z.email(CONTACT_VALIDATION_FIELD_ERROR_CODE.InvalidEmail));

export const optionalUrlString = z
  .string()
  .trim()
  .max(500, CONTACT_VALIDATION_FIELD_ERROR_CODE.TooLong)
  .optional()
  .transform((value) => value || undefined)
  .refine(
    (value) => !value || URL.canParse(value),
    CONTACT_VALIDATION_FIELD_ERROR_CODE.InvalidWebsite,
  );

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const nameStringSchema = z
  .string()
  .trim()
  .min(2, CONTACT_VALIDATION_FIELD_ERROR_CODE.Required)
  .max(120, CONTACT_VALIDATION_FIELD_ERROR_CODE.TooLong);
