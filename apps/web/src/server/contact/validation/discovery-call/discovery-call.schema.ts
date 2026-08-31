import { z } from "zod";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { CONTACT_PROJECT_SCOPES } from "@invessiv/common/constants/contact/contact-project-scopes";
import {
  CONTACT_SUBMISSION_ORIGIN_VALUES,
  ContactSubmissionOrigin,
} from "@invessiv/common/constants/contact/contact-submission-origin";
import {
  emailStringSchema,
  localeSchema,
  nameStringSchema,
  optionalTrimmedString,
} from "@/server/contact/validation/shared/contact-field-schemas";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";
import { applyDiscoveryCallValidationRules } from "@/server/contact/validation/discovery-call/discovery-call.validation-rules";

export const discoveryCallSchema = z
  .object({
    consentAccepted: z
      .boolean()
      .refine(
        (value) => value,
        CONTACT_VALIDATION_FIELD_ERROR_CODE.ConsentRequired,
      ),
    email: emailStringSchema,
    displayName: nameStringSchema,
    kind: z.literal(CONTACT_REQUEST_KIND.DiscoveryCall),
    locale: localeSchema,
    message: optionalTrimmedString,
    origin: z
      .enum(CONTACT_SUBMISSION_ORIGIN_VALUES)
      .default(ContactSubmissionOrigin.Website),
    projectScope: z.enum(CONTACT_PROJECT_SCOPES).optional(),
  })
  .superRefine(applyDiscoveryCallValidationRules);

export type DiscoveryCallValidationData = z.infer<typeof discoveryCallSchema>;
