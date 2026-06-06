export const LinkedinPostCaptionFit = {
  LineClamp: "line-clamp",
  Available: "available",
} as const;

export type LinkedinPostCaptionFit =
  (typeof LinkedinPostCaptionFit)[keyof typeof LinkedinPostCaptionFit];
