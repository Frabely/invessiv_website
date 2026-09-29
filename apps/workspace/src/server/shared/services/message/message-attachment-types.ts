import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";

/** One attachment as the page query reads it; `available` is already decided for the viewer. */
export type MessageAttachmentRow = {
  messageId: string;
  position: number;
  available: boolean;
  fileId: string;
  displayName: string;
  assetKind: AssetKind;
  url: string | null;
};
