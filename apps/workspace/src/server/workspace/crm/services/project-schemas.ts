import { z } from "zod";
import { ProjectFieldLimits } from "@invessiv/common/constants/crm/forms/project-field-limits";
import { PROJECT_BILLING_MODEL_VALUES } from "@invessiv/common/constants/crm/project-billing-models";
import { PROJECT_PHASE_SEQUENCE } from "@invessiv/common/constants/crm/project-phases";
import { PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/project-statuses";
import { sortFeedbackRoundPositions } from "@invessiv/common/patterns/crm/sort-feedback-round-positions";
import { formValidationSchemas } from "@invessiv/common/patterns/validation/form-validation-schemas";

const nullableText = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .transform((value) => value || null);
const nullableDate = z.iso.date().nullable();

// Sorted so that round numbers always follow the order in the track.
const feedbackRoundPositionsSchema = z
  .array(z.int().min(0))
  .max(ProjectFieldLimits.FeedbackRoundsMax)
  .transform(sortFeedbackRoundPositions);

const projectShape = z.object({
  title: z.string().trim().min(1).max(160),
  status: z.enum(PROJECT_STATUS_VALUES),
  phase: z.enum(PROJECT_PHASE_SEQUENCE),
  processSteps: z
    .array(
      z.string().trim().min(1).max(ProjectFieldLimits.ProcessStepMaxLength),
    )
    .min(1)
    .max(ProjectFieldLimits.ProcessStepsMaxCount),
  currentProcessStep: z
    .string()
    .trim()
    .min(1)
    .max(ProjectFieldLimits.ProcessStepMaxLength),
  billingModel: z.enum(PROJECT_BILLING_MODEL_VALUES),
  feedbackRoundPositions: feedbackRoundPositionsSchema,
  previewUrl: nullableText.pipe(formValidationSchemas.httpUrl.nullable()),
  nextStepLabel: nullableText,
  nextStepDueOn: nullableDate,
  startedOn: nullableDate,
  budgetCents: z.int().min(0).nullable(),
  hourlyRateCents: z.int().min(0).nullable(),
});

type ProjectShape = Omit<
  z.infer<typeof projectShape>,
  "feedbackRoundPositions"
> & {
  feedbackRoundPositions?: number[];
};

function refineProject(project: ProjectShape, context: z.RefinementCtx) {
  if (!project.processSteps.includes(project.currentProcessStep))
    context.addIssue({
      code: "custom",
      message: "Current process step must exist",
    });
  if (
    project.feedbackRoundPositions?.some(
      (position) => position > project.processSteps.length,
    )
  )
    context.addIssue({
      code: "custom",
      message: "Feedback round positions must lie within the process steps",
    });
}

export const projectSchemas = {
  entityId: z.uuid(),
  create: projectShape.superRefine(refineProject),
  // A browser tab loaded before the rounds existed sends no positions; the stored ones then stay.
  update: projectShape
    .extend({
      version: z.int().positive(),
      feedbackRoundPositions: feedbackRoundPositionsSchema.optional(),
    })
    .superRefine(refineProject),
} as const;
