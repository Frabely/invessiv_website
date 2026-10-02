import type { FeedbackItemKind } from "@invessiv/common/constants/crm/feedback-item-kinds";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type {
  feedbackRoundItems,
  feedbackRounds,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

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

/** Who writes on the customer's side, and the title the chat notice names. */
export type FeedbackCustomerWrite = {
  actor: ActivityActor;
  portalMembershipId: string;
  projectTitle: string;
};

/** Which member writes on the team's side, and the title the chat notice names. */
export type FeedbackMemberWrite = {
  actor: WorkspaceActor;
  projectTitle: string;
};

/** A file row the caller has locked `FOR UPDATE`; its version is the one to write against. */
export type LockedFeedbackFile = { id: string; version: number };

/** An item with the attachments the viewer may see, in upload order. */
export type LoadedFeedbackItem = {
  item: FeedbackRoundItemRow;
  attachments: FileAttachmentDto[];
};
