import type { AssetKind } from "../../constants/files/asset-kind";

/** A customer upload or link hung on one feedback item; downloads go through the file endpoints of the viewer's side. */
export interface FeedbackAttachmentDto {
  /** File entry the chip downloads or previews. */
  fileId: string;
  /** Original filename shown on the chip. */
  displayName: string;
  /** Drives the type icon and the preview. */
  assetKind: AssetKind;
  /** Verified byte size of a finished upload; 0 for a link, which has no bytes of its own. */
  sizeBytes: number;
}
