export const BulkEditFieldKey = {
  Status: "status",
  CategoryId: "category_id",
  Score: "score",
  Owner: "owner",
  NotesAppended: "notes_appended",
  ImprovementsAdded: "improvements_added",
} as const;

export type BulkEditFieldKey =
  (typeof BulkEditFieldKey)[keyof typeof BulkEditFieldKey];

export const BULK_EDIT_FIELD_KEY_VALUES = [
  BulkEditFieldKey.Status,
  BulkEditFieldKey.CategoryId,
  BulkEditFieldKey.Score,
  BulkEditFieldKey.Owner,
  BulkEditFieldKey.NotesAppended,
  BulkEditFieldKey.ImprovementsAdded,
] as const;
