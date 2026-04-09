import { z } from "zod";
import { CONTACT_REQUEST_KINDS } from "@/features/contact/contact-request-kind";
import {
  CONTACT_BUDGET_KEYS,
  CONTACT_GOAL_KEYS,
  CONTACT_OFFER_KEYS,
  CONTACT_PAGE_KEYS,
  CONTACT_START_KEYS,
  CONTACT_WORKFLOW_KEYS,
} from "@/features/contact/contact-options";

const optionalTrimmedString = z
  .string()
  .trim()
  .max(500, "too_long")
  .optional()
  .transform((value) => value || undefined);

const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "invalid_started_at");

const emailStringSchema = z.string().trim().pipe(z.email("invalid_email"));

const optionalUrlString = z
  .string()
  .trim()
  .max(500, "too_long")
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || URL.canParse(value), "invalid_website");

const localeSchema = z.enum(["de", "en"]);

export const projectRequestSchema = z
  .object({
    budgetKey: z.enum(CONTACT_BUDGET_KEYS).optional(),
    company: optionalTrimmedString,
    consentAccepted: z.boolean().refine((value) => value, "consent_required"),
    email: emailStringSchema,
    fullName: z
      .string()
      .trim()
      .min(2, "full_name_required")
      .max(120, "too_long"),
    goalKey: z.enum(CONTACT_GOAL_KEYS).optional(),
    kind: z.literal(CONTACT_REQUEST_KINDS[0]),
    locale: localeSchema,
    offerKey: z.enum(CONTACT_OFFER_KEYS),
    pagesCustom: optionalTrimmedString,
    pageKeys: z
      .array(z.enum(CONTACT_PAGE_KEYS))
      .max(12, "too_many_pages")
      .optional(),
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
  .superRefine((value, context) => {
    const requiresWebsite = ["upgrade", "web", "maintenance"].includes(
      value.offerKey,
    );

    if (value.offerKey === "landing" && !value.goalKey) {
      context.addIssue({
        code: "custom",
        message: "goal_required",
        path: ["goalKey"],
      });
    }

    if (value.offerKey === "process" && !value.workflowKey) {
      context.addIssue({
        code: "custom",
        message: "workflow_required",
        path: ["workflowKey"],
      });
    }

    if (value.offerKey === "web") {
      const hasPages = Boolean(value.pageKeys?.length || value.pagesCustom);
      if (!hasPages) {
        context.addIssue({
          code: "custom",
          message: "pages_required",
          path: ["pageKeys"],
        });
      }
    }

    if (requiresWebsite && !value.website) {
      context.addIssue({
        code: "custom",
        message: "website_required",
        path: ["website"],
      });
    }
  });

export const quickContactSchema = z.object({
  consentAccepted: z.boolean().refine((value) => value, "consent_required"),
  email: emailStringSchema,
  fullName: z.string().trim().min(2, "full_name_required").max(120, "too_long"),
  kind: z.literal(CONTACT_REQUEST_KINDS[1]),
  locale: localeSchema,
  message: z.string().trim().min(1, "message_required").max(5000, "too_long"),
});

export const contactSubmitSchema = z.discriminatedUnion("kind", [
  projectRequestSchema,
  quickContactSchema,
]);

export type ProjectRequestSubmitInput = z.infer<typeof projectRequestSchema>;
export type QuickContactSubmitInput = z.infer<typeof quickContactSchema>;

export function flattenContactFieldErrors(issues: z.core.$ZodIssue[]) {
  return issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const field = issue.path[0];
    if (typeof field !== "string") {
      return fieldErrors;
    }

    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
    return fieldErrors;
  }, {});
}
