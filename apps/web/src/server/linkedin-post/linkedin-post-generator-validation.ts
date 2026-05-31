import "server-only";
import { z } from "zod";
import { GENERATOR_COLOR_PAIRS } from "@/common/constants/generator/generator-color-pairs";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import {
  Locale,
  SUPPORTED_LOCALES,
} from "@invessiv/common/contracts/i18n/locale";
import { LINKEDIN_POST_TONE_VALUES } from "@/common/contracts/generator/linkedin-post-generator-tone";

const GENERATOR_COLOR_PAIR_IDS = [
  "auto",
  ...GENERATOR_COLOR_PAIRS.map((pair) => pair.id),
] as [string, ...string[]];

export const linkedinPostGeneratorRequestSchema = z.object({
  topic: z.string().trim().min(1).max(280),
  expertise: z.string().trim().min(1).max(120),
  tone: z.enum(LINKEDIN_POST_TONE_VALUES),
  colorPairId: z.enum(GENERATOR_COLOR_PAIR_IDS),
  displayName: z.string().trim().min(1).max(80),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email(CONTACT_FIELD_ERROR_CODE.InvalidEmail)),
  consent: z.literal(true),
  company: z.string().max(200).default(""),
  locale: z.enum(SUPPORTED_LOCALES).default(Locale.De),
});

export function mapGeneratorValidationErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") {
      continue;
    }
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.code];
  }
  return fieldErrors;
}
