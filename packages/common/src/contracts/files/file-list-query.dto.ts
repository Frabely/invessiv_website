import type { AssetKind } from "../../constants/files/asset-kind";
import type { FileOrigin } from "../../constants/files/file-origin";

export interface FileListQueryDto {
  /** One-based page, defaults to one. */
  page?: number;
  /** Bounded to 100 entries; defaults to 25. */
  pageSize?: number;
  /** Omit for all accessible projects; null selects customer-wide entries. */
  projectId?: string | null;
  /** Omit to include all formats and links. */
  assetKind?: AssetKind;
  /** Derived from upload origin and visibility. */
  origin?: FileOrigin;
  /** Literal substring search over name and note. */
  search?: string;
}
