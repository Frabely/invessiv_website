import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { FileOrigin } from "@invessiv/common/constants/files/file-origin";

export interface CustomerFilesFilter {
  /** Undefined lists every readable scope, null only customer-wide entries. */
  projectId?: string | null;
  assetKind?: AssetKind;
  origin?: FileOrigin;
  search: string;
}
