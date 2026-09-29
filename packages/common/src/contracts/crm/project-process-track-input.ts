import type { ProjectFeedbackRoundProgress } from "./project-feedback-round-progress";

export interface ProjectProcessTrackInput {
  /** Ordered free-text process labels. */
  processSteps: readonly string[];
  /** Current free-text label; ignored while a feedback round is running. */
  currentProcessStep: string;
  /** One entry per feedback round: the round sits before `processSteps[position]`. */
  feedbackRoundPositions: readonly number[];
  /** Round state once feedback rounds exist; absent until rounds are delivered. */
  roundProgress?: ProjectFeedbackRoundProgress;
  /** Localized label of one feedback round, e.g. "Feedbackrunde 2". */
  roundLabel: (roundNumber: number) => string;
}
