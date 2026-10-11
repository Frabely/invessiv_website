/** The company's stock of hours as the portal shows it, in whole minutes. Derived from ledger rows, never stored. */
export interface PortalHoursBalanceDto {
  /** Sum of every purchase row; corrections are negative and already included. */
  purchasedMinutes: number;
  /** Billable time entries across every project of the company, whatever its status. Goodwill never counts. */
  usedMinutes: number;
  /** Purchased minus used. Negative once the projects together used more than was bought. */
  remainingMinutes: number;
  /** Purchased but not yet assigned to any project; shown only when positive. */
  unassignedMinutes: number;
}
