import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";

/**
 * Shapes a CRM or portal file entry for the composer. Only an internal entry is released on send,
 * so the portal always passes false.
 */
export function toComposerAttachment(
  file: { id: string; displayName: string; assetKind: AssetKind },
  releasesOnSend: boolean,
): ComposerAttachment {
  return {
    fileId: file.id,
    displayName: file.displayName,
    assetKind: file.assetKind,
    releasesOnSend,
  };
}
