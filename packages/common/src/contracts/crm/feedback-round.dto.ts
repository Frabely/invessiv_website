import type { FeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";
import type { FeedbackRoundItemDto } from "./feedback-round-item.dto";

/** A feedback round with all items, attachments and results; internal view only. */
export interface FeedbackRoundDto {
  /** Round identifier; every status command addresses this value. */
  id: string;
  /** The one project this round belongs to. */
  projectId: string;
  /** Owning customer, derived from the project and stored for portal filters. */
  customerId: string;
  /** Position in the project's track, starting at 1; gapless per project. */
  roundNumber: number;
  /** Lifecycle state; allowed changes come from `FEEDBACK_ROUND_TRANSITIONS`. */
  status: FeedbackRoundStatus;
  /** HTTPS preview the feedback refers to; null when the handover had none. */
  previewUrl: string | null;
  /** "What's new" note from the handover; null when left empty. */
  handoverNote: string | null;
  /** Requested feedback date as `YYYY-MM-DD`; display only, nothing expires. */
  dueOn: string | null;
  /** Area list copied from the project at handover; later project edits do not change it. */
  areaOptions: string[];
  /** Member who handed the round over. */
  handedOverByMemberId: string;
  /** When the round was handed over. */
  handedOverAt: string;
  /** Last draft save by the customer; null while nothing was saved yet. */
  draftUpdatedAt: string | null;
  /** When the customer submitted; null while open and after the team handed it back. */
  submittedAt: string | null;
  /** Contact who submitted; null while unsubmitted or once the membership was removed. */
  submittedByPortalMembershipId: string | null;
  /** Note to the customer when the team asks for a call or hands the round back. */
  customerNotice: string | null;
  /** When implementation started; null before `in_progress`. */
  startedAt: string | null;
  /** When the team completed the round; null before `completed`. */
  completedAt: string | null;
  /** Member who completed the round; null before `completed`. */
  completedByMemberId: string | null;
  /** When the customer approved the project in this round; null unless `approved`. */
  approvedAt: string | null;
  /** Contact who approved; null unless approved or once the membership was removed. */
  approvedByPortalMembershipId: string | null;
  /** When a member first opened the submitted round; null counts as unread in the inbox. */
  readAt: string | null;
  /** Items in display order. */
  items: FeedbackRoundItemDto[];
  /** Optimistic-concurrency counter; every command must echo the value it read. */
  version: number;
  /** Creation timestamp supplied by the database. */
  createdAt: string;
  /** Last write timestamp; changes whenever the round version advances. */
  updatedAt: string;
}
