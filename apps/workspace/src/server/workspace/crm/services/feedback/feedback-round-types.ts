import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";

/** Project columns that decide whether and where the next round can be handed over. */
export type FeedbackProjectTrack = {
  id: string;
  customerId: string;
  title: string;
  status: ProjectStatus;
  version: number;
  processSteps: string[];
  currentProcessStep: string;
  feedbackRoundPositions: number[] | null;
  includedFeedbackRounds: number;
  feedbackAreas: string[];
};

/** A round of the project list together with its number of items. */
export type CountedFeedbackRound = {
  round: FeedbackRoundRow;
  itemCount: number;
};
