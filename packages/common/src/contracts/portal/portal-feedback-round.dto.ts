import type { FeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";
import type { PortalFeedbackItemDto } from "./portal-feedback-item.dto";

/** A feedback round as the customer sees it; internal actors and read state are left out. */
export interface PortalFeedbackRoundDto {
  /** Round identifier; draft, submit and approval commands address this value. */
  id: string;
  /** Position in the project's track, starting at 1. */
  roundNumber: number;
  /** Lifecycle state; the portal words it in "du" form. */
  status: FeedbackRoundStatus;
  /** HTTPS preview the feedback refers to; null when the handover had none. */
  previewUrl: string | null;
  /** "What's new" from the handover; null when left empty. */
  handoverNote: string | null;
  /** Requested feedback date as `YYYY-MM-DD`; display only. */
  dueOn: string | null;
  /** Areas the customer can pick; "general" is always offered in addition. */
  areaOptions: string[];
  /** Last draft save by any contact; null while nothing was saved. */
  draftUpdatedAt: string | null;
  /** Display name of the contact who saved last, so two contacts do not surprise each other. */
  draftUpdatedByName: string | null;
  /** When the round was submitted; null while open. */
  submittedAt: string | null;
  /** Note from the team for a requested call or a handed-back round. */
  customerNotice: string | null;
  /** When the team completed the round; results are visible from then on. */
  completedAt: string | null;
  /** When the project was approved in this round; null unless `approved`. */
  approvedAt: string | null;
  /** Items in display order. */
  items: PortalFeedbackItemDto[];
  /** Optimistic-concurrency counter; draft saves must echo it to detect a parallel edit. */
  version: number;
}
