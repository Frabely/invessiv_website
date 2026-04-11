import { z } from "zod";
import { CONTACT_REQUEST_KINDS } from "@/common/constants/contact/contact-request-kind";
import {
  emailStringSchema,
  localeSchema,
  nameStringSchema,
} from "@/server/contact/validation/shared/contact-field-schemas";
import { applyQuickContactValidationRules } from "@/server/contact/validation/quick-contact/quick-contact.validation-rules";

export const quickContactSchema = z
  .object({
    consentAccepted: z.boolean().refine((value) => value, "consent_required"),
    email: emailStringSchema,
    firstName: nameStringSchema,
    kind: z.literal(CONTACT_REQUEST_KINDS[1]),
    lastName: nameStringSchema,
    locale: localeSchema,
    message: z.string().trim().min(1, "message_required").max(5000, "too_long"),
  })
  .superRefine(applyQuickContactValidationRules);

export type QuickContactValidationData = z.infer<typeof quickContactSchema>;
