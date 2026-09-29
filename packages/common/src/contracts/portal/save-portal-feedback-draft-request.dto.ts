import type { PortalFeedbackDraftItemDto } from "./portal-feedback-draft-item.dto";

/** Replaces the whole draft of an open round; items missing from the list are removed. */
export interface SavePortalFeedbackDraftRequestDto {
  /** Round version the client last read; a stale value answers with 409 and the current draft. */
  version: number;
  /** Complete item list in display order. */
  items: PortalFeedbackDraftItemDto[];
}
