import type { AssetKind } from "../../constants/files/asset-kind";

/** A customer upload hung on one feedback item; downloads go through the file endpoints of the viewer's side. */
export interface FeedbackAttachmentDto {
  /** File entry the chip downloads or previews. */
  fileId: string;
  /** Original filename shown on the chip. */
  displayName: string;
  /** Drives the type icon and the preview. */
  assetKind: AssetKind;
  /** Verified byte size; feedback attachments are always finished uploads, never links. */
  sizeBytes: number;
}
