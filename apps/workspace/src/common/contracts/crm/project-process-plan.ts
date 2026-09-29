/** Editor state of a project's process track; mirrors the columns written on save. */
export interface ProjectProcessPlan {
  /** Ordered free-text step labels. */
  steps: string[];
  /** One entry per feedback round, ascending: the round sits before `steps[position]`. */
  feedbackRoundPositions: number[];
  /** Current free-text step; feedback rounds are never selectable here. */
  currentProcessStep: string;
}
