import { z } from "zod";

import { FEEDBACK_ITEM_KIND_VALUES } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";

const id = z.uuid().transform((value) => value.toLowerCase());
const version = z.int().positive();

// Counted in code points like Postgres `length()`, so an emoji is one character on both sides.
// The body is stored raw: no trimming, no markup handling.
const body = z
  .string()
  .refine((value) => [...value].length <= FEEDBACK_LIMITS.itemBodyMaxLength);

const draftItem = z.strictObject({
  id,
  areaLabel: z.string().nullable(),
  kind: z.enum(FEEDBACK_ITEM_KIND_VALUES).nullable(),
  body,
});

export const portalFeedbackSchemas = {
  id,
  draft: z.strictObject({
    version,
    items: z
      .array(draftItem)
      .max(FEEDBACK_LIMITS.itemsPerRound)
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
      ),
  }),
  submit: z.strictObject({ version }),
  // `confirmFinal` is checked by the handler, so a missing tick answers with its own code.
  approve: z.strictObject({ version, confirmFinal: z.boolean().optional() }),
  attach: z.strictObject({ fileId: id }),
} as const;
