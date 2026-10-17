/** Where a file preview renders: the full-size lightbox dialog or a side panel next to a list. */
export const FilePreviewStageVariant = {
  Dialog: "dialog",
  Panel: "panel",
} as const;

export type FilePreviewStageVariant =
  (typeof FilePreviewStageVariant)[keyof typeof FilePreviewStageVariant];
