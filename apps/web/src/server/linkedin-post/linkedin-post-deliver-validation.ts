import "server-only";
import { z } from "zod";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import { GeneratorZodIssueCode } from "@/common/constants/generator";
import {
  Locale,
  SUPPORTED_LOCALES,
} from "@invessiv/common/contracts/i18n/locale";

/**
 * Validates the gated deliver step body. The post content itself is not part of
 * the body — it lives signed inside `deliveryToken` and is verified separately.
 * `consentDelivery` is the required transactional consent; `consentMarketing`
 * stays optional and defaults to false.
 */
export const linkedinPostDeliverRequestSchema = z
  .object({
    deliveryToken: z.string().trim().min(1),
    displayName: z.string().trim().min(1).max(80),
    email: z.string().trim().min(1).max(254),
    consentDelivery: z.boolean().default(false),
    consentMarketing: z.boolean().default(false),
    company: z.string().max(200).default(""),
    locale: z.enum(SUPPORTED_LOCALES).default(Locale.De),
  })
  .superRefine((value, context) => {
    if (!CONTACT_EMAIL_PATTERN.test(value.email)) {
      context.addIssue({
        code: GeneratorZodIssueCode.Custom,
        message: CONTACT_FIELD_ERROR_CODE.InvalidEmail,
        path: ["email"],
      });
    }

    if (!value.consentDelivery) {
      context.addIssue({
        code: GeneratorZodIssueCode.Custom,
        message: CONTACT_FIELD_ERROR_CODE.ConsentRequired,
        path: ["consentDelivery"],
      });
    }
  });
