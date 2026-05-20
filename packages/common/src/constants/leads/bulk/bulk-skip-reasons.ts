export const BulkSkipReason = {
  NotesTooLong: "notes_too_long",
  Unknown: "unknown",
} as const;

export type BulkSkipReason =
  (typeof BulkSkipReason)[keyof typeof BulkSkipReason];

export const BULK_SKIP_REASON_VALUES = [
  BulkSkipReason.NotesTooLong,
  BulkSkipReason.Unknown,
] as const;
