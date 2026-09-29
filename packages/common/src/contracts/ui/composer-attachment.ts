import type { AssetKind } from "../../constants/files/asset-kind";

/** A file or link the viewer picked for the message being written; no URL is ever kept. */
export type ComposerAttachment = {
  /** File entry the message will reference. */
  fileId: string;
  /** Shown on the chip and in a pending bubble. */
  displayName: string;
  /** Drives the type icon. */
  assetKind: AssetKind;
  /** Internal entry that becomes visible to the customer on send; only the CRM sets it. */
  releasesOnSend: boolean;
};
