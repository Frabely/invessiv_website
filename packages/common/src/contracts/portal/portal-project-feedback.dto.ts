import type { FeedbackQuotaDto } from "../crm/feedback-quota.dto";
import type { PortalFeedbackRoundDto } from "./portal-feedback-round.dto";

/** Everything the portal feedback page of one project shows. */
export interface PortalProjectFeedbackDto {
  /** Project the page belongs to. */
  projectId: string;
  /** Project title for the page heading. */
  projectTitle: string;
  /** Included, used and remaining rounds, plus the running and the approved round. */
  quota: FeedbackQuotaDto;
  /** The running round; null between rounds and after the approval. */
  activeRound: PortalFeedbackRoundDto | null;
  /** Finished rounds, newest first, including an approved one. */
  history: PortalFeedbackRoundDto[];
  /** Whether this viewer may save, attach, submit and approve; the owner view only reads. */
  canSubmit: boolean;
}
