/** The hours of one project the portal shows by name. */
export interface PortalProjectHoursDto {
  /** Matches the dashboard's project selection and the `projectId` of a time entry. */
  projectId: string;
  /** Project title as navigation; present because the reader may read hours, not project details. */
  title: string;
  /** What the project may use: assignments minus releases, without the single rows behind them. */
  allocatedMinutes: number;
  /** Billable time entries of this project. */
  usedMinutes: number;
  /** Allocated minus used. Negative while the project used more than it was assigned. */
  remainingMinutes: number;
}
