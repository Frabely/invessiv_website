import { lineItemFieldsSchemas } from "./line-item-fields-schemas";
import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { z } from "zod";

import {
  LINE_ITEM_KIND_VALUES,
  LineItemKind,
} from "@invessiv/common/constants/crm/line-item-kinds";
import {
  LINE_ITEM_PROJECT_MODE_VALUES,
  LineItemProjectMode,
} from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LINE_ITEM_TEMPLATE_STATUS_VALUES } from "@invessiv/common/constants/crm/line-item-template-statuses";

const baseFieldsSchema = lineItemFieldsSchemas
  .fields(LineItemTemplateFieldLimits)
  .extend({
    kind: z.enum(LINE_ITEM_KIND_VALUES),
    projectMode: z.enum(LINE_ITEM_PROJECT_MODE_VALUES),
    portalRequestable: z.boolean(),
    portalDescription: z
      .string()
      .trim()
      .max(LineItemTemplateFieldLimits.PortalDescriptionMaxLength),
  });

type KindFields = {
  kind: LineItemKind;
  pricingMode: ServicePricingMode;
  projectMode: LineItemProjectMode;
  portalRequestable: boolean;
  portalDescription: string;
};

/**
 * Hours are sold at a rate, a further round at a one-off price, and both act on a project that
 * already exists. A released entry carries the text customers read: the internal description
 * never stands in for it.
 */
function refineKind(data: KindFields, context: z.RefinementCtx) {
  const requiredPricingMode =
    data.kind === LineItemKind.Hours
      ? ServicePricingMode.Rate
      : data.kind === LineItemKind.FeedbackRound
        ? ServicePricingMode.OneTime
        : null;
  if (requiredPricingMode && data.pricingMode !== requiredPricingMode) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pricingMode"],
      message: "Pricing mode does not match the kind",
    });
  }
  if (
    data.kind !== LineItemKind.Standard &&
    data.projectMode !== LineItemProjectMode.ExistingProject
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["projectMode"],
      message: "This kind always extends an existing project",
    });
  }
  if (data.portalRequestable && data.portalDescription === "") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["portalDescription"],
      message: "A released template needs a customer description",
    });
  }
}

function refineTemplate(
  data: KindFields & { recurringInterval: BillingInterval | null },
  context: z.RefinementCtx,
) {
  lineItemFieldsSchemas.refineIntervalConsistency(data, context);
  refineKind(data, context);
}

export const lineItemTemplateSchemas = {
  entityId: z.uuid(),
  create: baseFieldsSchema.superRefine(refineTemplate),
  update: baseFieldsSchema
    .extend({
      status: z.enum(LINE_ITEM_TEMPLATE_STATUS_VALUES),
      version: z.int().positive(),
    })
    .superRefine(refineTemplate),
} as const;
