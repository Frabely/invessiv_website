/** One time entry as the customer reads it: when, how long and what for. Never who. */
export interface PortalTimeEntryDto {
  /** Opaque list key; no endpoint addresses a single entry. */
  id: string;
  /** Null for entries on projects the portal does not show. */
  projectId: string | null;
  /** Calendar day (`YYYY-MM-DD`) the work was done; groups the list by month. */
  performedOn: string;
  /** Whole minutes, a multiple of the booking step. */
  durationMinutes: number;
  /** Written by the team for the customer; rendered as plain text only. */
  description: string;
  /** False for goodwill: shown as "not charged" and counted in no sum. */
  billable: boolean;
  /** Only for customer-visible tasks and readers with `portal.tasks.read`; otherwise null. */
  taskTitle: string | null;
}
