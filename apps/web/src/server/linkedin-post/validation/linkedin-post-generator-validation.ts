import "server-only";
import { z } from "zod";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import { GENERATOR_COLOR_PAIRS } from "@/common/constants/generator/post/generator-color-pairs";
import { GeneratorZodIssueCode } from "@/common/constants/generator";
import {
  Locale,
  SUPPORTED_LOCALES,
} from "@invessiv/common/contracts/i18n/locale";
import { LINKEDIN_POST_TONE_VALUES } from "@/common/contracts/generator/post/linkedin-post-generator-tone";

const GENERATOR_COLOR_PAIR_IDS = [
  "auto",
  ...GENERATOR_COLOR_PAIRS.map((pair) => pair.id),
] as [string, ...string[]];

export const linkedinPostGeneratorRequestSchema = z
  .object({
    topic: z.string().trim().min(1).max(280),
    expertise: z.string().trim().min(1).max(120),
    tone: z.enum(LINKEDIN_POST_TONE_VALUES),
    colorPairId: z.enum(GENERATOR_COLOR_PAIR_IDS),
    displayName: z.string().trim().max(80).default(""),
    email: z.string().trim().max(254).default(""),
    consent: z.boolean().default(false),
    company: z.string().max(200).default(""),
    locale: z.enum(SUPPORTED_LOCALES).default(Locale.De),
  })
  .superRefine((value, context) => {
    if (value.email !== "" && !CONTACT_EMAIL_PATTERN.test(value.email)) {
      context.addIssue({
        code: GeneratorZodIssueCode.Custom,
        message: CONTACT_FIELD_ERROR_CODE.InvalidEmail,
        path: ["email"],
      });
    }

    if (value.email !== "" && !value.consent) {
      context.addIssue({
        code: GeneratorZodIssueCode.Custom,
        message: CONTACT_FIELD_ERROR_CODE.ConsentRequired,
        path: ["consent"],
      });
    }
  });

function mapGeneratorValidationErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") {
      continue;
    }

    const fieldErrorCode =
      issue.code === GeneratorZodIssueCode.Custom ? issue.message : issue.code;
    fieldErrors[field] = [...(fieldErrors[field] ?? []), fieldErrorCode];
  }
  return fieldErrors;
}

export const linkedinPostGeneratorValidationService = {
  mapGeneratorValidationErrors,
} as const;
