import { z } from "zod";

import { BILLING_INTERVAL_VALUES } from "@invessiv/common/constants/crm/billing-intervals";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";

const snapshotFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(ProjectLineItemFieldLimits.TitleMaxLength),
  description: z
    .string()
    .trim()
    .max(ProjectLineItemFieldLimits.DescriptionMaxLength),
  priceCents: z.int().min(0).max(ProjectLineItemFieldLimits.PriceCentsMax),
  pricingMode: z.enum(SERVICE_PRICING_MODE_VALUES),
  recurringInterval: z
    .enum(BILLING_INTERVAL_VALUES)
    .nullish()
    .transform((value) => value ?? null),
});

/** A recurring service must carry an interval; every other pricing mode must not. */
function refineIntervalConsistency(
  data: { pricingMode: ServicePricingMode; recurringInterval: unknown },
  context: z.RefinementCtx,
) {
  const requiresInterval = data.pricingMode === ServicePricingMode.Recurring;
  const hasInterval = data.recurringInterval !== null;
  if (requiresInterval !== hasInterval) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["recurringInterval"],
      message: "Recurring interval is required only for recurring pricing",
    });
  }
}

export const projectLineItemSchemas = {
  entityId: z.uuid(),
  // The origin template is mandatory on create: this build assigns from the catalog only.
  create: snapshotFieldsSchema
    .extend({ sourceLineItemTemplateId: z.uuid() })
    .superRefine(refineIntervalConsistency),
  update: snapshotFieldsSchema
    .extend({ version: z.int().positive() })
    .superRefine(refineIntervalConsistency),
} as const;
