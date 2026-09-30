import { z } from "zod";

import {
  FEEDBACK_ITEM_RESULT_VALUES,
  FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE,
} from "@invessiv/common/constants/crm/feedback-item-results";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { validateFileLink } from "@invessiv/common/patterns/files/validate-file-link";
import { businessToday } from "@/common/patterns/time/business-today";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => value || null);

const version = z.number().int().positive();

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
  .refine((value) => value === null || value >= businessToday());

const areaOptions = z
  .array(z.string().trim().min(1).max(FEEDBACK_LIMITS.areaLabelMaxLength))
  .max(FEEDBACK_LIMITS.areasPerProject)
  .refine((areas) => new Set(areas).size === areas.length);

// A handback without a reason leaves the customer guessing; start and completion have nothing to say.
const changeStatus = z.discriminatedUnion("to", [
  z.strictObject({
    version,
    to: z.literal(FeedbackRoundStatus.InDiscussion),
    customerNotice: optionalText(FEEDBACK_LIMITS.noteMaxLength),
  }),
  z.strictObject({
    version,
    to: z.literal(FeedbackRoundStatus.Open),
    customerNotice: z.string().trim().min(1).max(FEEDBACK_LIMITS.noteMaxLength),
  }),
  z.strictObject({
    version,
    to: z.literal(FeedbackRoundStatus.InProgress),
    customerNotice: z.null().optional(),
  }),
  z.strictObject({
    version,
    to: z.literal(FeedbackRoundStatus.Completed),
    customerNotice: z.null().optional(),
  }),
]);

// Mirrors the reply CHECK on the item row, so the database never has to refuse it.
const setItemResult = z
  .strictObject({
    version,
    result: z.enum(FEEDBACK_ITEM_RESULT_VALUES),
    resultNote: optionalText(FEEDBACK_LIMITS.noteMaxLength),
  })
  .refine(
    ({ result, resultNote }) =>
      resultNote !== null ||
      !(FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE as readonly string[]).includes(
        result,
      ),
    { path: ["resultNote"] },
  );

export const feedbackRoundSchemas = {
  entityId: z.uuid(),
  markRead: z.strictObject({ version }),
  handOver: z.strictObject({
    previewUrl,
    handoverNote: optionalText(FEEDBACK_LIMITS.noteMaxLength),
    dueOn,
    areaOptions,
  }),
  changeStatus,
  setItemResult,
} as const;
