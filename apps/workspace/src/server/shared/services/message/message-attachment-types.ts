import type { files } from "@invessiv/db/record-configuration";

/** One attachment as the page query reads it; `available` is already decided for the viewer. */
export type MessageAttachmentRow = {
  messageId: string;
  position: number;
  available: boolean;
  fileId: string;
  displayName: string;
  assetKind: (typeof files.$inferSelect)["asset_kind"];
  url: string | null;
};
