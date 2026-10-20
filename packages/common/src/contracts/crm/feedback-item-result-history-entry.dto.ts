import type { FeedbackItemResult } from "../../constants/crm/feedback-item-results";
import type { FeedbackResultActorSide } from "../../constants/crm/feedback-result-actor-sides";
import type { FeedbackResultHistoryEventKind } from "../../constants/crm/feedback-result-history-event-kinds";

/** Internal history; never exposed through portal DTOs. */
export interface FeedbackItemResultHistoryEntryDto {
  /** Stable identity of the immutable event. */
  id: string;
  /** Baseline describes a pre-existing result, not its original creation. */
  kind: FeedbackResultHistoryEventKind;
  /** Item version after the change, or the observed version for a baseline. */
  itemVersion: number;
  /** Result after this event; null means reset to pending. */
  result: FeedbackItemResult | null;
  /** Plain-text result explanation; null for resets or results without a note. */
  resultNote: string | null;
  /** Determines the localized role fallback when the author cannot be resolved. */
  actorSide: FeedbackResultActorSide;
  /** Current display name; null when the author is no longer resolvable. */
  actorName: string | null;
  /** Business timestamp in ISO format; the original result timestamp for a baseline. */
  occurredAt: string;
}
