import { z } from "zod";

import {
  HOUR_PURCHASE_KIND_VALUES,
  HourPurchaseKind,
} from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";

/** Signed ledger minutes: never zero, always on the booking step, bounded like the DB check. */
const ledgerMinutes = z
  .int()
  .refine((minutes) => minutes !== 0)
  .refine((minutes) => minutes % HoursLimits.StepMinutes === 0)
  .refine((minutes) => Math.abs(minutes) <= HoursLimits.MaxLedgerMinutes);

const note = z.string().trim().max(HoursLimits.NoteMaxLength);

/** Whether the day lies in the future is checked by the handler, which knows the business day. */
const timeEntryFields = z.strictObject({
  performedOn: z.iso.date(),
  durationMinutes: z
    .int()
    .min(HoursLimits.StepMinutes)
    .max(HoursLimits.MaxEntryMinutes)
    .refine((minutes) => minutes % HoursLimits.StepMinutes === 0),
  description: z.string().trim().min(1).max(HoursLimits.DescriptionMaxLength),
  billable: z.boolean(),
  taskId: z.uuid().nullable(),
});
const version = z.int().positive();

export const hoursSchemas = {
  entityId: z.uuid(),
  createPurchase: z
    .strictObject({
      idempotencyKey: z.uuid(),
      kind: z.enum(HOUR_PURCHASE_KIND_VALUES),
      minutes: ledgerMinutes,
      purchasedOn: z.iso.date(),
      note,
    })
    // The sign is implied by the kind; a mismatch is a client bug, not something to repair.
    .refine(
      (data) => (data.kind === HourPurchaseKind.Purchase) === data.minutes > 0,
      { path: ["minutes"] },
    ),
  createAllocation: z.strictObject({
    idempotencyKey: z.uuid(),
    projectId: z.uuid(),
    minutes: ledgerMinutes,
    note,
  }),
  createTimeEntry: timeEntryFields,
  updateTimeEntry: timeEntryFields.extend({ version }),
  deleteTimeEntry: z.strictObject({ version }),
} as const;
