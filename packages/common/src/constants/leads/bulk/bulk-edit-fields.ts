export const BulkEditField = {
  Status: "status",
  Category: "category",
  Score: "score",
  Owner: "owner",
  NotesAppend: "notesAppend",
  ImprovementsAppend: "improvementsAppend",
} as const;

export type BulkEditField = (typeof BulkEditField)[keyof typeof BulkEditField];
