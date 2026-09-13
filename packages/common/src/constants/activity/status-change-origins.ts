export const StatusChangeOrigin = {
  SingleEdit: "single_edit",
  BulkEdit: "bulk_edit",
  BulkArchive: "bulk_archive",
} as const;

export type StatusChangeOrigin =
  (typeof StatusChangeOrigin)[keyof typeof StatusChangeOrigin];

export const STATUS_CHANGE_ORIGIN_VALUES = [
  StatusChangeOrigin.SingleEdit,
  StatusChangeOrigin.BulkEdit,
  StatusChangeOrigin.BulkArchive,
] as const;
