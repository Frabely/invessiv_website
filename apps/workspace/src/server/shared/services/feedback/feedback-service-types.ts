import type { FeedbackItemKind } from "@invessiv/common/constants/crm/feedback-item-kinds";
import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type {
  feedbackRoundItems,
  feedbackRounds,
} from "@invessiv/db/record-configuration";

export type FeedbackRoundRow = typeof feedbackRounds.$inferSelect;
export type FeedbackRoundItemRow = typeof feedbackRoundItems.$inferSelect;

/** What every feedback service needs to address a round and to log on its customer and project. */
export type FeedbackRoundRef = Pick<
  FeedbackRoundRow,
  "id" | "project_id" | "customer_id" | "round_number"
>;

/** One draft item after the handler validated it; the order of the list becomes the position. */
export type FeedbackDraftItemInput = {
  id: string;
  areaLabel: string | null;
  kind: FeedbackItemKind | null;
  body: string;
};

/** File columns of one attachment as the item query selects them. */
export type FeedbackAttachmentRow = {
  fileId: string;
  displayName: string;
  assetKind: AssetKind;
  sizeBytes: number | null;
};

/** An item with the attachments the viewer may see, in upload order. */
export type LoadedFeedbackItem = {
  item: FeedbackRoundItemRow;
  attachments: FeedbackAttachmentDto[];
};
