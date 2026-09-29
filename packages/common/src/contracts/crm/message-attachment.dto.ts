import type { AssetKind } from "../../constants/files/asset-kind";

/** An entry the viewer may see; downloads go through the file endpoints of the viewer's side. */
export interface AvailableMessageAttachmentDto {
  /** Order within the message; stable React key also for entries the viewer cannot see. */
  position: number;
  /** The viewer may see the entry. */
  available: true;
  /** File entry the chip downloads or opens. */
  fileId: string;
  /** Name shown on the chip. */
  displayName: string;
  /** Drives the type icon. */
  assetKind: AssetKind;
  /** Target of a link entry; null for uploads, which are never addressed by a storage URL. */
  url: string | null;
}

/** An entry the viewer may no longer see; nothing but its position is revealed. */
export interface UnavailableMessageAttachmentDto {
  /** Order within the message; the only thing that stays visible. */
  position: number;
  /** Release withdrawn, project hidden or entry orphaned for this viewer. */
  available: false;
  /** Hidden, so a withdrawn release never reveals the entry. */
  fileId: null;
  /** Hidden, so a withdrawn release never reveals the name. */
  displayName: null;
  /** Hidden; the chip shows a neutral icon. */
  assetKind: null;
  /** Hidden; nothing can be opened. */
  url: null;
}

/** A file or link referenced by a message, resolved for the current viewer. */
export type MessageAttachmentDto =
  AvailableMessageAttachmentDto | UnavailableMessageAttachmentDto;
