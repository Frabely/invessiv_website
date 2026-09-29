import type { FeedbackItemKind } from "../../constants/crm/feedback-item-kinds";
import type { FeedbackItemResult } from "../../constants/crm/feedback-item-results";
import type { FeedbackAttachmentDto } from "./feedback-attachment.dto";

/** One feedback item as the team sees it, including the internal result. */
export interface FeedbackRoundItemDto {
  /** Client-generated id; stays stable across autosaves, so the draft editor keys on it. */
  id: string;
  /** Display order within the round, starting at 0. */
  position: number;
  /** Snapshot out of the round's `areaOptions`; null means "general". */
  areaLabel: string | null;
  /** Optional classification by the customer; null when left open. */
  kind: FeedbackItemKind | null;
  /** Plain text by the customer; may be empty while the round is still a draft. */
  body: string;
  /** Contact who wrote the item; null once that membership was removed. */
  createdByPortalMembershipId: string | null;
  /** Outcome set by the team; null until the item has been worked on. */
  result: FeedbackItemResult | null;
  /** Reply to the customer; required for `not_implemented` and `additional_service`. */
  resultNote: string | null;
  /** Member who set the result; set exactly while `result` is set. */
  resultSetByMemberId: string | null;
  /** When the result was set; set exactly while `result` is set. */
  resultSetAt: string | null;
  /** Customer uploads on this item in upload order. */
  attachments: FeedbackAttachmentDto[];
  /** Optimistic-concurrency counter of the item row, used when the team sets a result. */
  version: number;
}
