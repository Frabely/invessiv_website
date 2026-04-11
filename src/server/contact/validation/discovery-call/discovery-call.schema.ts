import { z } from "zod";
import { CONTACT_REQUEST_KINDS } from "@/common/constants/contact/contact-request-kind";
import {
  emailStringSchema,
  localeSchema,
  nameStringSchema,
  optionalTrimmedString,
} from "@/server/contact/validation/shared/contact-field-schemas";
import { applyDiscoveryCallValidationRules } from "@/server/contact/validation/discovery-call/discovery-call.validation-rules";

export const discoveryCallSchema = z
  .object({
    consentAccepted: z.boolean().refine((value) => value, "consent_required"),
    email: emailStringSchema,
    firstName: nameStringSchema,
    kind: z.literal(CONTACT_REQUEST_KINDS[2]),
    lastName: nameStringSchema,
    locale: localeSchema,
    message: optionalTrimmedString,
  })
  .superRefine(applyDiscoveryCallValidationRules);

export type DiscoveryCallValidationData = z.infer<typeof discoveryCallSchema>;
