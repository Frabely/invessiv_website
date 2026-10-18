import type { FeedbackQuotaDto } from "../crm/feedback-quota.dto";
import type { PortalFeedbackRoundDto } from "./portal-feedback-round.dto";
import type { PortalContactDto } from "./portal-contact.dto";

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
  /** Whether this viewer may save, submit and approve; the owner view only reads. */
  canSubmit: boolean;
  /**
   * Whether this viewer may attach and detach files; needs `canSubmit` plus the portal file read
   * right, because attachments are shown through the portal's file visibility.
   */
  canAttach: boolean;
  /**
   * Who answers for the project (project owner, else customer owner, each only while active), with
   * the meeting link of whoever offers one. Shown for a requested call and when every round is
   * used; null without an active responsible member.
   */
  contact: PortalContactDto | null;
}
