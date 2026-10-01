import { AssetKind } from "../../files/asset-kind";

/** Kinds a `files` field may restrict itself to; a link is no upload and is never offered. */
export const QUESTIONNAIRE_ACCEPTED_ASSET_KIND_VALUES = [
  AssetKind.Document,
  AssetKind.Image,
  AssetKind.Video,
  AssetKind.Font,
] as const;
