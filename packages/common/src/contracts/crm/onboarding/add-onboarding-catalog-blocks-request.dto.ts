/** Appends snapshot copies of active catalog blocks to a form. */
export interface AddOnboardingCatalogBlocksRequestDto {
  /** Catalog blocks to copy in the order they should appear in the form. */
  catalogBlockIds: string[];
  /** Form version the client last read; a stale value answers with the current form. */
  expectedFormVersion: number;
}
