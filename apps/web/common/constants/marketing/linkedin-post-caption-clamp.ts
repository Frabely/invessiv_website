export const LinkedinPostCaptionClamp = {
  Default: "default",
  Result: "result",
} as const;

export type LinkedinPostCaptionClamp =
  (typeof LinkedinPostCaptionClamp)[keyof typeof LinkedinPostCaptionClamp];
