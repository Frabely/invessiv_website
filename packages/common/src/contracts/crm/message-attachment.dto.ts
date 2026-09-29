import type { AssetKind } from "../../constants/files/asset-kind";

/** A file or link referenced by a message, resolved for the current viewer. */
export interface MessageAttachmentDto {
  /** Order within the message; stable React key also for entries the viewer cannot see. */
  position: number;
  /** False once the viewer may no longer see the entry; every other field is then null. */
  available: boolean;
  /** File entry; downloads go through the file endpoints of the viewer's side. Null when unavailable. */
  fileId: string | null;
  /** Null when unavailable, so a withdrawn release never reveals the name. */
  displayName: string | null;
  /** Drives the type icon; null when unavailable. */
  assetKind: AssetKind | null;
  /** Target of a link entry; null for uploads, which are never addressed by a storage URL. */
  url: string | null;
}
