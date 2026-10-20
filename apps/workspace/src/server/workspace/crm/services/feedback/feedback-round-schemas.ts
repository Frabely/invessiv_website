import { z } from "zod";

import {
  FEEDBACK_ITEM_RESULT_VALUES,
  FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE,
} from "@invessiv/common/constants/crm/feedback-item-results";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { SetFeedbackItemResultRequestDto } from "@invessiv/common/contracts/crm/set-feedback-item-result-request.dto";
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

// A call may come with a note for the customer; start and completion have nothing to say.
const changeStatus = z.discriminatedUnion("to", [
  z.strictObject({
    version,
    to: z.literal(FeedbackRoundStatus.InDiscussion),
    customerNotice: optionalText(FEEDBACK_LIMITS.noteMaxLength),
  }),
  // Legacy handback from a tab opened before Task 80: still parsed, so the command answers with
  // INVALID_TRANSITION and a reload hint instead of a bare validation error. Remove in a cleanup.
  z.strictObject({
    version,
    to: z.literal(FeedbackRoundStatus.Open),
    customerNotice: optionalText(FEEDBACK_LIMITS.noteMaxLength),
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

const RESULT_NOTE_PATH = [
  "resultNote",
] as const satisfies readonly (keyof SetFeedbackItemResultRequestDto)[];

// Mirrors the reply CHECK on the item row, so the database never has to refuse it.
const setItemResult = z
  .strictObject({
    version,
    commandId: z
      .uuid()
      .transform((value) => value.toLowerCase())
      .optional(),
    result: z.enum(FEEDBACK_ITEM_RESULT_VALUES).nullable(),
    resultNote: optionalText(FEEDBACK_LIMITS.noteMaxLength),
  })
  .refine(
    ({ result, resultNote }) =>
      resultNote !== null ||
      result === null ||
      !(FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE as readonly string[]).includes(
        result,
      ),
    { path: [...RESULT_NOTE_PATH] },
  )
  .refine(({ result, resultNote }) => result !== null || resultNote === null, {
    path: [...RESULT_NOTE_PATH],
  });

export const feedbackRoundSchemas = {
  closeClarification: z.strictObject({
    commandId: z.uuid().transform((value) => value.toLowerCase()),
    version,
    note: z.string().trim().min(1).max(FEEDBACK_LIMITS.noteMaxLength),
  }),
  askClarification: z.strictObject({
    commandId: z.uuid().transform((value) => value.toLowerCase()),
    version,
    question: z.string().trim().min(1).max(FEEDBACK_LIMITS.noteMaxLength),
  }),
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
