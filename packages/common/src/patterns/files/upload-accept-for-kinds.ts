import type { AssetKind } from "../../constants/files/asset-kind";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "../../constants/files/upload-accept";
import { UPLOAD_LIMIT_BY_KIND } from "../../constants/files/upload-limits";

const EXTENSIONS_BY_KIND: Partial<Record<AssetKind, readonly string[]>> =
  Object.fromEntries(
    Object.entries(UPLOAD_LIMIT_BY_KIND).map(([kind, limits]) => [
      kind,
      Object.keys(limits),
    ]),
  );

/**
 * The `accept` hint of a file picker for a field that takes only some kinds. Null means every
 * kind. It only narrows what the picker offers; the server still decides what is attachable.
 */
export function uploadAcceptForKinds(
  kinds: readonly AssetKind[] | null,
): string {
  if (kinds === null) return UPLOAD_ACCEPT_ATTRIBUTE;
  return kinds
    .flatMap((kind) => EXTENSIONS_BY_KIND[kind] ?? [])
    .map((extension) => `.${extension}`)
    .join(",");
}
