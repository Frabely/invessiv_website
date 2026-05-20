import { z } from "zod";

import {
  CONTACT_LEAD_STATUS_VALUES,
  ContactLeadStatus,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadBulkAction } from "@invessiv/common/constants/leads/bulk/lead-bulk-actions";
import { BulkEditLimits } from "@invessiv/common/constants/leads/bulk/bulk-edit-limits";
import { LeadValidationIssueCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";

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
    status: z
      .enum(CONTACT_LEAD_STATUS_VALUES)
      .refine((status) => status !== ContactLeadStatus.Archived, {
        message: LeadValidationIssueCode.BulkEditStatusArchiveDisallowed,
      })
      .optional(),
    categoryId: z.uuid().nullable().optional(),
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
    notesAppend: z
      .string()
      .min(1)
      .max(LeadFieldLimits.NotesMaxLength)
      .optional(),
    improvementsAppend: z
      .array(z.string().min(1).max(LeadFieldLimits.ImprovementMaxLength))
      .max(BulkEditLimits.MaxImprovementsPerRequest)
      .optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: LeadValidationIssueCode.BulkEditEmptyPatch,
  });

const idsSchema = z.array(z.uuid()).min(1).max(BulkEditLimits.MaxIdsPerRequest);

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
