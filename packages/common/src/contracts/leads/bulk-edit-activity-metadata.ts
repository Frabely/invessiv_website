export type BulkEditActivityMetadata = {
  changedFields: string[];
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  notesAppendedChars?: number;
  improvementsAddedCount?: number;
};
