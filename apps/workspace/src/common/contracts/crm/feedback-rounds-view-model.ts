import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import type { ProjectFeedbackRoundProgress } from "@invessiv/common/contracts/crm/project-feedback-round-progress";
import type { ProjectFeedbackRoundsDto } from "@invessiv/common/contracts/crm/project-feedback-rounds.dto";

/**
 * Feedback rounds of the project tab that is open in the cockpit. The page only builds it for a
 * project the actor may read; without it the section does not exist at all.
 */
export type FeedbackRoundsViewModel = {
  projectId: string;
  /** Quota, rounds and whether and why a handover is possible. */
  overview: ProjectFeedbackRoundsDto;
  /** The round opened through the URL; null when none is opened or it belongs elsewhere. */
  detail: FeedbackRoundDto | null;
  /** `projects.write` on the project: the handover and the reason why it is not possible. */
  canWrite: boolean;
  /** Attachments and the ZIP need `files.read` on the project; items show without it. */
  canReadFiles: boolean;
  /** Preview link the handover dialog starts from: the last round's, else the project's. */
  defaultPreviewUrl: string | null;
  /** Running, completed and approved round for the process track. */
  roundProgress: ProjectFeedbackRoundProgress;
};
