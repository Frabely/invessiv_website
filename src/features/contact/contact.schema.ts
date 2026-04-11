import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/config/i18n";
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

const optionalTrimmedStringArray = z
  .array(z.string().trim().min(1, "required").max(120, "too_long"))
  .max(12, "too_many_pages")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

function hasUniqueValues(values: readonly string[] | undefined) {
  if (!values) {
    return true;
  }

  return new Set(values).size === values.length;
}

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

const localeSchema = z.enum(SUPPORTED_LOCALES);
const nameStringSchema = z
  .string()
  .trim()
  .min(2, "required")
  .max(120, "too_long");

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
  .superRefine((value, context) => {
    const requiresWebsite = ["upgrade", "maintenance"].includes(value.offerKey);

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
      const hasPages = Boolean(
        value.pageKeys?.length || value.customPageNames?.length,
      );
      if (!hasPages) {
        context.addIssue({
          code: "custom",
          message: "pages_required",
          path: ["pageKeys"],
        });
      }
    }

    if (!hasUniqueValues(value.pageKeys)) {
      context.addIssue({
        code: "custom",
        message: "duplicate_page_keys",
        path: ["pageKeys"],
      });
    }

    if (!hasUniqueValues(value.customPageNames)) {
      context.addIssue({
        code: "custom",
        message: "duplicate_custom_page_names",
        path: ["customPageNames"],
      });
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
  firstName: nameStringSchema,
  kind: z.literal(CONTACT_REQUEST_KINDS[1]),
  lastName: nameStringSchema,
  locale: localeSchema,
  message: z.string().trim().min(1, "message_required").max(5000, "too_long"),
});

export const discoveryCallSchema = z.object({
  consentAccepted: z.boolean().refine((value) => value, "consent_required"),
  email: emailStringSchema,
  firstName: nameStringSchema,
  kind: z.literal(CONTACT_REQUEST_KINDS[2]),
  lastName: nameStringSchema,
  locale: localeSchema,
  message: optionalTrimmedString,
});

export const contactSubmitSchema = z.discriminatedUnion("kind", [
  projectRequestSchema,
  quickContactSchema,
  discoveryCallSchema,
]);

export type ProjectRequestSubmitInput = z.infer<typeof projectRequestSchema>;
export type QuickContactSubmitInput = z.infer<typeof quickContactSchema>;
export type DiscoveryCallSubmitInput = z.infer<typeof discoveryCallSchema>;

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
