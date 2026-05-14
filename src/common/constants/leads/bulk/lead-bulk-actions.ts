export const LeadBulkAction = {
  BulkEdit: "bulk_edit",
  Archive: "archive",
  Delete: "delete",
} as const;

export type LeadBulkAction =
  (typeof LeadBulkAction)[keyof typeof LeadBulkAction];

export const LEAD_BULK_ACTION_VALUES = [
  LeadBulkAction.BulkEdit,
  LeadBulkAction.Archive,
  LeadBulkAction.Delete,
] as const;
