import type { AssetKind } from "../../constants/files/asset-kind";
import type { UploadExtension } from "../../constants/files/upload-extension";
import type { FileErrorCode } from "../../constants/files/file-error-code";

export type UploadClassification =
  | {
      ok: true;
      assetKind: AssetKind;
      extension: UploadExtension;
      contentType: string;
      maxBytes: number;
    }
  | { ok: false; code: FileErrorCode };
