import { z } from "zod";

import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";
import { LeadBulkAction } from "@/common/constants/leads/bulk/lead-bulk-actions";
import { BulkEditLimits } from "@/common/constants/leads/bulk/bulk-edit-limits";
import { LeadValidationIssueCode } from "@/common/constants/leads/errors/lead-error-codes";
import { LeadFieldLimits } from "@/common/constants/leads/forms/lead-field-limits";

export { LeadBulkAction } from "@/common/constants/leads/bulk/lead-bulk-actions";

const optionalNullableTrimmedString = (max: number) =>
  z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value === null) return null;
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .pipe(z.union([z.string().max(max), z.null()]));

const bulkEditPatchSchema = z
  .object({
    status: z.enum(CONTACT_LEAD_STATUS_VALUES).optional(),
    category_id: z.string().uuid().nullable().optional(),
    score: z
      .number()
      .int()
      .min(LeadFieldLimits.ScoreMin)
      .max(LeadFieldLimits.ScoreMax)
      .nullable()
      .optional(),
    owner: optionalNullableTrimmedString(
      LeadFieldLimits.OwnerMaxLength,
    ).optional(),
    notes_append: z
      .string()
      .min(1)
      .max(LeadFieldLimits.NotesMaxLength)
      .optional(),
    improvements_append: z
      .array(z.string().min(1).max(LeadFieldLimits.ImprovementMaxLength))
      .max(BulkEditLimits.MaxImprovementsPerRequest)
      .optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: LeadValidationIssueCode.BulkEditEmptyPatch,
  });

export type BulkEditPatch = z.infer<typeof bulkEditPatchSchema>;

const idsSchema = z
  .array(z.string().uuid())
  .min(1)
  .max(BulkEditLimits.MaxIdsPerRequest);

export const leadBulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(LeadBulkAction.BulkEdit),
    ids: idsSchema,
    patch: bulkEditPatchSchema,
  }),
  z.object({
    action: z.literal(LeadBulkAction.Archive),
    ids: idsSchema,
  }),
  z.object({
    action: z.literal(LeadBulkAction.Delete),
    ids: idsSchema,
  }),
]);

export type LeadBulkActionInput = z.infer<typeof leadBulkActionSchema>;
