export const AssetKind = {
  Document: "document",
  Image: "image",
  Video: "video",
  Font: "font",
  Link: "link",
} as const;
export type AssetKind = (typeof AssetKind)[keyof typeof AssetKind];
export const ASSET_KIND_VALUES = [
  AssetKind.Document,
  AssetKind.Image,
  AssetKind.Video,
  AssetKind.Font,
  AssetKind.Link,
] as const;
