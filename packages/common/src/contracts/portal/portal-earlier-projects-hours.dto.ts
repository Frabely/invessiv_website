/**
 * Everything booked on projects the portal does not show (archived or cancelled), as one sum
 * without a title. It exists so that the project rows still add up to the company balance.
 */
export interface PortalEarlierProjectsHoursDto {
  /** Assignments minus releases across all projects the portal hides. */
  allocatedMinutes: number;
  /** Billable time entries across those projects. */
  usedMinutes: number;
  /** Allocated minus used across those projects; may be negative. */
  remainingMinutes: number;
  /** Sum of positive project remainders, before offsetting overdrawn projects. */
  openMinutes: number;
  /** Sum of individual project overruns, before offsetting other projects' remainders. */
  overMinutes: number;
}
