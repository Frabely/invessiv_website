import { z } from "zod";
import { BILLING_INTERVAL_VALUES } from "@invessiv/common/constants/crm/billing-intervals";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { LineItemFieldsLimits } from "@/common/contracts/crm/line-item-fields-limits";

function fields(limits: LineItemFieldsLimits) {
  return z.object({
    title: z.string().trim().min(1).max(limits.TitleMaxLength),
    description: z.string().trim().max(limits.DescriptionMaxLength),
    priceCents: z.int().min(0).max(limits.PriceCentsMax),
    pricingMode: z.enum(SERVICE_PRICING_MODE_VALUES),
    recurringInterval: z
      .enum(BILLING_INTERVAL_VALUES)
      .nullish()
      .transform((value) => value ?? null),
  });
}

function refineIntervalConsistency(
  data: {
    pricingMode: ServicePricingMode;
    recurringInterval: BillingInterval | null;
  },
  context: z.RefinementCtx,
) {
  if (
    (data.pricingMode === ServicePricingMode.Recurring) !==
    (data.recurringInterval !== null)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["recurringInterval"],
      message: "Recurring interval is required only for recurring pricing",
    });
  }
}

export const lineItemFieldsSchemas = {
  fields,
  refineIntervalConsistency,
} as const;
