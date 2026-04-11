import { z } from "zod";
import { CONTACT_REQUEST_KINDS } from "@/common/constants/contact/contact-request-kind";
import {
  CONTACT_BUDGET_KEYS,
  CONTACT_GOAL_KEYS,
  CONTACT_OFFER_KEYS,
  CONTACT_PAGE_KEYS,
  CONTACT_START_KEYS,
  CONTACT_WORKFLOW_KEYS,
} from "@/common/constants/contact/contact-options";
import {
  emailStringSchema,
  isoDateTimeSchema,
  localeSchema,
  nameStringSchema,
  optionalTrimmedString,
  optionalTrimmedStringArray,
  optionalUrlString,
} from "@/server/contact/validation/shared/contact-field-schemas";
import { applyProjectRequestValidationRules } from "@/server/contact/validation/project-request/project-request.validation-rules";

export const projectRequestSchema = z
  .object({
    budgetKey: z.enum(CONTACT_BUDGET_KEYS).optional(),
    company: optionalTrimmedString,
    consentAccepted: z.boolean().refine((value) => value, "consent_required"),
    email: emailStringSchema,
    firstName: nameStringSchema,
    goalKey: z.enum(CONTACT_GOAL_KEYS).optional(),
    kind: z.literal(CONTACT_REQUEST_KINDS[0]),
    lastName: nameStringSchema,
    locale: localeSchema,
    offerKey: z.enum(CONTACT_OFFER_KEYS),
    customPageNames: optionalTrimmedStringArray,
    pageKeys: z.array(z.enum(CONTACT_PAGE_KEYS)).optional(),
    phone: optionalTrimmedString,
    preferredStartKey: z.enum(CONTACT_START_KEYS).optional(),
    projectDetails: z
      .string()
      .trim()
      .min(5, "project_details_required")
      .max(5000, "too_long"),
    role: optionalTrimmedString,
    startedAt: isoDateTimeSchema,
    website: optionalUrlString,
    websiteTrap: z.string().trim().max(0, "spam_detected").optional(),
    workflowKey: z.enum(CONTACT_WORKFLOW_KEYS).optional(),
  })
  .superRefine(applyProjectRequestValidationRules);

export type ProjectRequestValidationData = z.infer<typeof projectRequestSchema>;
