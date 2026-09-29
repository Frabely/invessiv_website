/** Round quota of one project, derived from its round steps and handed-over rounds. */
export interface FeedbackQuotaDto {
  /** Round steps in the project's track; this is the quota. */
  included: number;
  /** Rounds handed over so far, i.e. the highest round number. */
  used: number;
  /** Rounds that can still be handed over; 0 once the project is approved. */
  remaining: number;
  /** Round that is currently running (open up to in progress); null between rounds. */
  activeRoundNumber: number | null;
  /** Round in which the customer approved the project; null before the approval. */
  approvedRoundNumber: number | null;
}
