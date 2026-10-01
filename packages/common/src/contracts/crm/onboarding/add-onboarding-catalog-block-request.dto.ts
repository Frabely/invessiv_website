/** Appends a snapshot copy of an active catalog block to a form. */
export interface AddOnboardingCatalogBlockRequestDto {
  /** Catalog block to copy; the copy keeps its key and remembers it as origin for the pre-fill. */
  catalogBlockId: string;
  /** Form version the client last read; a stale value answers with a 409 and the current form. */
  expectedFormVersion: number;
}
