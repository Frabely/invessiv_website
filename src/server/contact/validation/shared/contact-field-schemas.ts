import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/config/i18n";

export const optionalTrimmedString = z
  .string()
  .trim()
  .max(500, "too_long")
  .optional()
  .transform((value) => value || undefined);

export const optionalTrimmedStringArray = z
  .array(z.string().trim().min(1, "required").max(120, "too_long"))
  .max(12, "too_many_pages")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "invalid_started_at");

export const emailStringSchema = z
  .string()
  .trim()
  .pipe(z.email("invalid_email"));

export const optionalUrlString = z
  .string()
  .trim()
  .max(500, "too_long")
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || URL.canParse(value), "invalid_website");

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const nameStringSchema = z
  .string()
  .trim()
  .min(2, "required")
  .max(120, "too_long");
