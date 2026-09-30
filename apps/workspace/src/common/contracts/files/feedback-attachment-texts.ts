import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { FileLightboxLabels } from "@invessiv/common/contracts/ui/file-lightbox-labels";

/** The part of a files dictionary (CRM or portal) that the feedback attachment list needs. */
export type FeedbackAttachmentTexts = {
  row: {
    opensInNewTab: string;
    actionsLabel: string;
    preview: string;
    previewNamed: string;
    download: string;
    downloadNamed: string;
    open: string;
    openNamed: string;
  };
  kinds: Readonly<Record<AssetKind, string>>;
  lightbox: FileLightboxLabels;
};
