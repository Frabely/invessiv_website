export const FilePreviewKind = {
  Image: "image",
  Pdf: "pdf",
  Text: "text",
  Video: "video",
} as const;
export type FilePreviewKind =
  (typeof FilePreviewKind)[keyof typeof FilePreviewKind];
