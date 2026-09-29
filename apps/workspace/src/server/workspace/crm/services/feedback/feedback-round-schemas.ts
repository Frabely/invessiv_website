import { z } from "zod";

import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { validateFileLink } from "@invessiv/common/patterns/files/validate-file-link";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => value || null);

// The feedback link leaves the CRM, so it gets the same HTTPS checks as a shared file link.
const previewUrl = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null)
  .refine((value) => value === null || validateFileLink(value));

// Compared as `YYYY-MM-DD` text in the business time zone, like task due dates.
const dueOn = z.iso
  .date()
  .nullish()
  .transform((value) => value ?? null)
  .refine(
    (value) => value === null || value >= taskDueStateService.businessToday(),
  );

const areaOptions = z
  .array(z.string().trim().min(1).max(FEEDBACK_LIMITS.areaLabelMaxLength))
  .max(FEEDBACK_LIMITS.areasPerProject)
  .refine((areas) => new Set(areas).size === areas.length);

export const feedbackRoundSchemas = {
  entityId: z.uuid(),
  handOver: z.strictObject({
    previewUrl,
    handoverNote: optionalText(FEEDBACK_LIMITS.noteMaxLength),
    dueOn,
    areaOptions,
  }),
} as const;
