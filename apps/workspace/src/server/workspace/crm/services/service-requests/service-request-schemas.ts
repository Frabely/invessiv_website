import { z } from "zod";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestFieldLimits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";
import { projectSchemas } from "../project-schemas";
import { lineItemTemplateSchemas } from "../line-item-template-schemas";
import { projectLineItemSchemas } from "../project-line-item-schemas";
import { lineItemFieldsSchemas } from "../line-item-fields-schemas";
export const serviceRequestSchemas = {
  entityId: z.uuid(),
  changeStatus: z.discriminatedUnion("to", [
    z.object({ to: z.literal(S.Offered), version: z.int().positive() }),
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
