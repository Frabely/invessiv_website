export const FileThumbnailOutcome = {
  Created: "created",
  Skipped: "skipped",
  Failed: "failed",
} as const;
export type FileThumbnailOutcome =
  (typeof FileThumbnailOutcome)[keyof typeof FileThumbnailOutcome];
