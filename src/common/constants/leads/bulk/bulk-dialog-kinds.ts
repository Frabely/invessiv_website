export const BulkDialogKind = {
  Edit: "edit",
  Archive: "archive",
  Delete: "delete",
} as const;

export type BulkDialogKind =
  (typeof BulkDialogKind)[keyof typeof BulkDialogKind];
