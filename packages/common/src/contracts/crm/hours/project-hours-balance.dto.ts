/** The hours of one project in whole minutes, derived from its allocations and time entries. */
export interface ProjectHoursBalanceDto {
  /** Project the values belong to. */
  projectId: string;
  /** Allocations minus releases; blocked for every other project of the customer. */
  allocatedMinutes: number;
  /** Billable time entries of this project. */
  usedMinutes: number;
  /** Time entries of this project marked as not billable. */
  goodwillMinutes: number;
  /** Allocated minus used. Negative while the project is overdrawn; never balanced automatically. */
  remainingMinutes: number;
  /** What a release may hand back: the remaining minutes, or zero while overdrawn. */
  releasableMinutes: number;
}
