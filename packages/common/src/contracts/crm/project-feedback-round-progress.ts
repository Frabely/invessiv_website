export interface ProjectFeedbackRoundProgress {
  /** Round that is currently running (open up to in progress); null between rounds. */
  activeRoundNumber: number | null;
  /** Highest completed round; the track shows every round up to it as done. */
  completedRoundNumber: number | null;
  /** Round in which the customer approved the project; later rounds disappear from the track. */
  approvedRoundNumber: number | null;
}
