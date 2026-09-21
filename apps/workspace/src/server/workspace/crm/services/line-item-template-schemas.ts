import { z } from "zod";

import { BILLING_INTERVAL_VALUES } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import { LINE_ITEM_TEMPLATE_STATUS_VALUES } from "@invessiv/common/constants/crm/line-item-template-statuses";

const baseFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(LineItemTemplateFieldLimits.TitleMaxLength),
  description: z
    .string()
    .trim()
    .max(LineItemTemplateFieldLimits.DescriptionMaxLength),
  priceCents: z.int().min(0).max(LineItemTemplateFieldLimits.PriceCentsMax),
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

export const lineItemTemplateSchemas = {
  entityId: z.uuid(),
  create: baseFieldsSchema.superRefine(refineIntervalConsistency),
  update: baseFieldsSchema
    .extend({
      status: z.enum(LINE_ITEM_TEMPLATE_STATUS_VALUES),
      version: z.int().positive(),
    })
    .superRefine(refineIntervalConsistency),
} as const;
