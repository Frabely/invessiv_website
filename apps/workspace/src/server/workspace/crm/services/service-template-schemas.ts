import { z } from "zod";

import { BILLING_INTERVAL_VALUES } from "@invessiv/common/constants/crm/billing-intervals";
import { ServiceTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/service-template-field-limits";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import { SERVICE_TEMPLATE_STATUS_VALUES } from "@invessiv/common/constants/crm/service-template-statuses";

const baseFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(ServiceTemplateFieldLimits.TitleMaxLength),
  description: z
    .string()
    .trim()
    .max(ServiceTemplateFieldLimits.DescriptionMaxLength),
  priceCents: z.int().min(0).max(ServiceTemplateFieldLimits.PriceCentsMax),
  pricingMode: z.enum(SERVICE_PRICING_MODE_VALUES),
  recurringInterval: z
    .enum(BILLING_INTERVAL_VALUES)
    .nullish()
    .transform((value) => value ?? null),
});

/** A recurring template must carry an interval; every other pricing mode must not. */
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

export const serviceTemplateSchemas = {
  entityId: z.uuid(),
  create: baseFieldsSchema.superRefine(refineIntervalConsistency),
  update: baseFieldsSchema
    .extend({
      status: z.enum(SERVICE_TEMPLATE_STATUS_VALUES),
      version: z.int().positive(),
    })
    .superRefine(refineIntervalConsistency),
} as const;
