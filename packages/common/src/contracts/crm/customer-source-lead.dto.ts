/** Minimal backlink shown in a customer record. */
export interface CustomerSourceLeadDto {
  /** Stable lead identifier used in the leads route. */
  id: string;
  /** Human-readable lead name. */
  displayName: string;
}
