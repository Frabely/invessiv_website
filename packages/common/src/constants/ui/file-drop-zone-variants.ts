export const FileDropZoneVariant = {
  Large: "large",
  Compact: "compact",
} as const;

export type FileDropZoneVariant =
  (typeof FileDropZoneVariant)[keyof typeof FileDropZoneVariant];
