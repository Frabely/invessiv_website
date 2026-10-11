/** Books time on the project named in the URL. The booking member is always the caller. */
export interface CreateTimeEntryRequestDto {
  /** Calendar day (`YYYY-MM-DD`), never in the future. */
  performedOn: string;
  /** Whole minutes in 15-minute steps, bounded by HoursLimits.MaxEntryMinutes. */
  durationMinutes: number;
  /** Customer-visible text of what was done; required. */
  description: string;
  /** False books goodwill that does not count against the hours. */
  billable: boolean;
  /** A task of the same project that is not cancelled, or null. */
  taskId: string | null;
}
