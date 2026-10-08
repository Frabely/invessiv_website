/** The customer-wide stock in whole minutes. Every value is derived from ledger rows, never stored. */
export interface CustomerHoursBalanceDto {
  /** Sum of all purchase rows; corrections are negative and already included. */
  purchasedMinutes: number;
  /** Sum of all allocations minus releases across every project of the customer. */
  allocatedMinutes: number;
  /** Purchased but not yet allocated to any project; the only stock a new allocation may draw from. */
  freeMinutes: number;
  /** Billable time entries across every project. Goodwill entries are not part of it. */
  usedMinutes: number;
  /** Time entries marked as not billable; shown for transparency, counted against nothing. */
  goodwillMinutes: number;
  /** Purchased minus used. Negative once the projects together overdrew the stock. */
  remainingMinutes: number;
}
