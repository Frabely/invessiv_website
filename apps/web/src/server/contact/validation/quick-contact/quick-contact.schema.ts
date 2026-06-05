import { z } from "zod";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import {
  CONTACT_SUBMISSION_ORIGIN_VALUES,
  ContactSubmissionOrigin,
} from "@invessiv/common/constants/contact/contact-submission-origin";
import {
  emailStringSchema,
  localeSchema,
  nameStringSchema,
} from "@/server/contact/validation/shared/contact-field-schemas";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";
import { applyQuickContactValidationRules } from "@/server/contact/validation/quick-contact/quick-contact.validation-rules";

export const quickContactSchema = z
  .object({
    consentAccepted: z
      .boolean()
      .refine(
        (value) => value,
        CONTACT_VALIDATION_FIELD_ERROR_CODE.ConsentRequired,
      ),
    email: emailStringSchema,
    displayName: nameStringSchema,
    kind: z.literal(CONTACT_REQUEST_KIND.QuickContact),
    locale: localeSchema,
    message: z
      .string()
      .trim()
      .min(1, CONTACT_VALIDATION_FIELD_ERROR_CODE.MessageRequired)
      .max(5000, CONTACT_VALIDATION_FIELD_ERROR_CODE.TooLong),
    origin: z
      .enum(CONTACT_SUBMISSION_ORIGIN_VALUES)
      .default(ContactSubmissionOrigin.Website),
  })
  .superRefine(applyQuickContactValidationRules);

export type QuickContactValidationData = z.infer<typeof quickContactSchema>;
