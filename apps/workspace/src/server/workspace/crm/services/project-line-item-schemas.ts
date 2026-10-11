import { lineItemFieldsSchemas } from "./line-item-fields-schemas";
import { z } from "zod";

import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import { PROJECT_LINE_ITEM_STATUS_VALUES } from "@invessiv/common/constants/crm/project-line-item-statuses";

const snapshotFieldsSchema = lineItemFieldsSchemas
  .fields(ProjectLineItemFieldLimits)
  .extend({
    status: z.enum(PROJECT_LINE_ITEM_STATUS_VALUES).default("planned"),
  });

export const projectLineItemSchemas = {
  entityId: z.uuid(),
  // The origin template is mandatory on create: this build assigns from the catalog only.
  // Whether a quantity belongs to the template's kind is decided where the kind is known.
  create: snapshotFieldsSchema
    .extend({
      sourceLineItemTemplateId: z.uuid(),
      sourceLineItemTemplateVersion: z.int().positive().optional(),
      idempotencyKey: z.uuid().optional(),
      quantityMinutes: z
        .int()
        .positive()
        .multipleOf(HoursLimits.StepMinutes)
        .max(HoursLimits.MaxLedgerMinutes)
        .nullish()
        .transform((value) => value ?? null),
      allocateHoursToProject: z.boolean().default(true),
    })
    .superRefine(lineItemFieldsSchemas.refineIntervalConsistency),
  update: snapshotFieldsSchema
    .extend({ version: z.int().positive() })
    .superRefine(lineItemFieldsSchemas.refineIntervalConsistency),
} as const;
