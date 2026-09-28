export const AssetKind = {
  Document: "document",
  Image: "image",
  Video: "video",
  Font: "font",
  Link: "link",
} as const;
export type AssetKind = (typeof AssetKind)[keyof typeof AssetKind];
export const ASSET_KIND_VALUES = Object.values(AssetKind);
