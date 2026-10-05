export interface ProjectProcessTrackStatusLabels {
  /** Spoken state of a step that lies before the current one. */
  complete: string;
  /** Spoken state of the current free-text step. */
  current: string;
  /** Spoken state of a step that has not been reached. */
  upcoming: string;
  /** Spoken state of the running feedback round; replaces `current` there. */
  feedbackRunning: string;
}
