import { z } from "zod";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import { ServiceRequestFieldLimits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";
import { SERVICE_PRICING_MODE_VALUES } from "@invessiv/common/constants/crm/service-pricing-modes";
import { BILLING_INTERVAL_VALUES } from "@invessiv/common/constants/crm/billing-intervals";
import { projectSchemas } from "../project-schemas";
import { lineItemTemplateSchemas } from "../line-item-template-schemas";
import { projectLineItemSchemas } from "../project-line-item-schemas";
import { lineItemFieldsSchemas } from "../line-item-fields-schemas";
export const serviceRequestSchemas = {
  entityId: z.uuid(),
  changeStatus: z.discriminatedUnion("to", [
    z
      .object({
        to: z.literal(S.Offered),
        version: z.int().positive(),
        priceCents: z
          .int()
          .min(0)
          .max(ProjectLineItemFieldLimits.PriceCentsMax),
        pricingMode: z.enum(SERVICE_PRICING_MODE_VALUES),
        recurringInterval: z.enum(BILLING_INTERVAL_VALUES).nullable(),
        minutes: z
          .int()
          .positive()
          .multipleOf(HoursLimits.StepMinutes)
          .max(HoursLimits.MaxLedgerMinutes)
          .nullable(),
      })
      .superRefine(lineItemFieldsSchemas.refineIntervalConsistency),
    z.object({ to: z.literal(S.Withdrawn), version: z.int().positive() }),
    z.object({
      to: z.literal(S.Declined),
      version: z.int().positive(),
      reason: z
        .string()
        .trim()
        .min(1)
        .max(ServiceRequestFieldLimits.DeclineReasonMaxLength),
    }),
  ]),
  accept: z.object({
    version: z.int().positive(),
    acceptWithoutOffer: z.boolean(),
    project: z.discriminatedUnion("mode", [
      z.object({ mode: z.literal(Mode.Existing), projectId: z.uuid() }),
      z.object({ mode: z.literal(Mode.New), project: projectSchemas.create }),
    ]),
    template: z.discriminatedUnion("mode", [
      z.object({
        mode: z.literal(Mode.Existing),
        lineItemTemplateId: z.uuid(),
      }),
      z.object({
        mode: z.literal(Mode.New),
        template: lineItemTemplateSchemas.create,
      }),
    ]),
    lineItem: z
      .object(projectLineItemSchemas.create.shape)
      .omit({
        sourceLineItemTemplateId: true,
        sourceLineItemTemplateVersion: true,
        idempotencyKey: true,
      })
      .superRefine(lineItemFieldsSchemas.refineIntervalConsistency),
  }),
} as const;
