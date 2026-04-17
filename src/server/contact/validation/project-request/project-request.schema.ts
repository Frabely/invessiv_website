import { z } from "zod";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import { CONTACT_BUDGET_KEYS } from "@/common/constants/contact/contact-budget-keys";
import { CONTACT_GOAL_KEYS } from "@/common/constants/contact/contact-goal-keys";
import { CONTACT_OFFER_KEYS } from "@/common/constants/contact/contact-offer-keys";
import { CONTACT_PAGE_KEYS } from "@/common/constants/contact/contact-page-keys";
import { CONTACT_START_KEYS } from "@/common/constants/contact/contact-start-keys";
import { CONTACT_WORKFLOW_KEYS } from "@/common/constants/contact/contact-workflow-keys";
import {
  emailStringSchema,
  isoDateTimeSchema,
  localeSchema,
  nameStringSchema,
  optionalTrimmedString,
  optionalTrimmedStringArray,
  optionalUrlString,
} from "@/server/contact/validation/shared/contact-field-schemas";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";
import { applyProjectRequestValidationRules } from "@/server/contact/validation/project-request/project-request.validation-rules";

export const projectRequestSchema = z
  .object({
    budgetKey: z.enum(CONTACT_BUDGET_KEYS).optional(),
    company: optionalTrimmedString,
    consentAccepted: z
      .boolean()
      .refine(
        (value) => value,
        CONTACT_VALIDATION_FIELD_ERROR_CODE.ConsentRequired,
      ),
    email: emailStringSchema,
    firstName: nameStringSchema,
    goalKey: z.enum(CONTACT_GOAL_KEYS).optional(),
    kind: z.literal(CONTACT_REQUEST_KIND.ProjectRequest),
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
      .min(5, CONTACT_VALIDATION_FIELD_ERROR_CODE.ProjectDetailsRequired)
      .max(5000, CONTACT_VALIDATION_FIELD_ERROR_CODE.TooLong),
    role: optionalTrimmedString,
    startedAt: isoDateTimeSchema,
    website: optionalUrlString,
    websiteTrap: z
      .string()
      .trim()
      .max(0, CONTACT_VALIDATION_FIELD_ERROR_CODE.SpamDetected)
      .optional(),
    workflowKey: z.enum(CONTACT_WORKFLOW_KEYS).optional(),
  })
  .superRefine(applyProjectRequestValidationRules);

export type ProjectRequestValidationData = z.infer<typeof projectRequestSchema>;
