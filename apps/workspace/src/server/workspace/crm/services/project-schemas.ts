import { z } from "zod";
import { PROJECT_BILLING_MODEL_VALUES } from "@invessiv/common/constants/crm/project-billing-models";
import { PROJECT_PHASE_SEQUENCE } from "@invessiv/common/constants/crm/project-phases";
import { PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/project-statuses";
import { formValidationSchemas } from "@invessiv/common/patterns/validation/form-validation-schemas";

const nullableText = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .transform((value) => value || null);
const nullableDate = z.iso.date().nullable();

const projectFields = z
  .object({
    title: z.string().trim().min(1).max(160),
    status: z.enum(PROJECT_STATUS_VALUES),
    phase: z.enum(PROJECT_PHASE_SEQUENCE),
    processSteps: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
    currentProcessStep: z.string().trim().min(1).max(80),
    billingModel: z.enum(PROJECT_BILLING_MODEL_VALUES),
    previewUrl: nullableText.pipe(formValidationSchemas.httpUrl.nullable()),
    nextStepLabel: nullableText,
    nextStepDueOn: nullableDate,
    startedOn: nullableDate,
    budgetCents: z.int().min(0).nullable(),
    hourlyRateCents: z.int().min(0).nullable(),
  })
  .superRefine((project, context) => {
    if (!project.processSteps.includes(project.currentProcessStep))
      context.addIssue({
        code: "custom",
        message: "Current process step must exist",
      });
  });

export const projectSchemas = {
  entityId: z.uuid(),
  create: projectFields,
  update: projectFields.extend({ version: z.int().positive() }),
} as const;
