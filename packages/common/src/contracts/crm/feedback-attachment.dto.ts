import type { AssetKind } from "../../constants/files/asset-kind";
import type { FileSource } from "../../constants/files/file-source";
import type { UploadExtension } from "../../constants/files/upload-extension";

/**
 * A customer upload or link hung on one feedback item. The shape matches the shared file row and
 * lightbox, so both sides show attachments with the same building blocks; downloads go through the
 * file endpoints of the viewer's side.
 */
export interface FeedbackAttachmentDto {
  /** File entry id; download, preview and detaching address this value. */
  id: string;
  /** Original filename or link title shown in the row. */
  displayName: string;
  /** Drives the type icon and the preview. */
  assetKind: AssetKind;
  /** Upload or link; a link opens in a new tab instead of downloading. */
  source: FileSource;
  /** Validated extension of an upload; null for links. */
  extension: UploadExtension | null;
  /** Verified byte size of an upload; null for links. */
  sizeBytes: number | null;
  /** HTTPS target of a link; null for uploads. */
  url: string | null;
  /** Plain-text note the customer added when uploading; null when left empty. */
  note: string | null;
  /** When the file entry was created, not when it was attached. */
  createdAt: string;
}
