/** Preserves open and overdrawn time separately, including across earlier projects. */
export type HoursProjectUsage = {
  /** Billable time, including project overruns. */
  usedMinutes: number;
  /** Sum of positive project remainders; overdrawn projects add nothing. */
  openMinutes: number;
  /** Sum of individual project overruns; other projects' remainders do not reduce it. */
  overMinutes: number;
};
