import type { PortalFeedbackDraftItemDto } from "@invessiv/common/contracts/portal/portal-feedback-draft-item.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { FeedbackDraftItem } from "@/common/contracts/portal/feedback-draft-item";

function fromRound(round: PortalFeedbackRoundDto): FeedbackDraftItem[] {
  return round.items.map((item) => ({
    id: item.id,
    areaLabel: item.areaLabel,
    kind: item.kind,
    body: item.body,
    attachments: item.attachments,
  }));
}

function toRequestItems(
  items: readonly FeedbackDraftItem[],
): PortalFeedbackDraftItemDto[] {
  return items.map(({ id, areaLabel, kind, body }) => ({
    id,
    areaLabel,
    kind,
    body,
  }));
}

/** Own texts to copy after a conflict, one paragraph per item. */
function toPlainText(items: readonly FeedbackDraftItem[]): string {
  return items
    .map((item) => item.body.trim())
    .filter(Boolean)
    .join("\n\n");
}

export const feedbackDraftItems = {
  fromRound,
  toRequestItems,
  toPlainText,
} as const;
