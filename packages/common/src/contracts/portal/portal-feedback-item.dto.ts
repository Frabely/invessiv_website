import type { FeedbackItemKind } from "../../constants/crm/feedback-item-kinds";
import type { FeedbackItemResult } from "../../constants/crm/feedback-item-results";
import type { FileAttachmentDto } from "../files/file-attachment.dto";

/** One feedback item as the customer sees it; who set the result stays internal. */
export interface PortalFeedbackItemDto {
  /** Client-generated id; the draft editor keys on it and sends it back on save. */
  id: string;
  /** Display order within the round, starting at 0. */
  position: number;
  /** One of the round's areas; null means "general". */
  areaLabel: string | null;
  /** Optional classification; null when left open. */
  kind: FeedbackItemKind | null;
  /** The customer's own text; may be empty while drafting. */
  body: string;
  /** Outcome; null until the round is `completed` or `approved`, even if the team already set it. */
  result: FeedbackItemResult | null;
  /** Reply of the team; null under the same rule as `result`. */
  resultNote: string | null;
  /** Uploads on this item in upload order. */
  attachments: FileAttachmentDto[];
}
