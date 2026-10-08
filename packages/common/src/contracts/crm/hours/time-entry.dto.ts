/** Time booked on one project. Everything except the author is what the customer reads in the portal. */
export interface TimeEntryDto {
  /** Id of the entry; update and delete address this value. */
  id: string;
  /** The one project the time counts against. An entry never moves to another project. */
  projectId: string;
  /** Optional task of the same project the time was spent on; null when none was named. */
  taskId: string | null;
  /** Calendar day (`YYYY-MM-DD`) the work was done, never in the future. */
  performedOn: string;
  /** Whole minutes, a multiple of the booking step, at most one day. */
  durationMinutes: number;
  /** Customer-visible text of what was done. Required: it is the line the customer reads. */
  description: string;
  /** False marks goodwill: shown to the customer, but not counted against the hours. */
  billable: boolean;
  /** Internal member who booked the time. Never part of a portal contract. */
  performedByMemberId: string;
  /** Optimistic-concurrency counter; every update and delete must echo the value it read. */
  version: number;
  /** ISO timestamp of the booking; orders entries of the same day and feeds the list cursor. */
  createdAt: string;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}
