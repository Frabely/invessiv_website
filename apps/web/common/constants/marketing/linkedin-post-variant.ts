export const LinkedinPostVariant = {
  Card: "card",
  Lightbox: "lightbox",
} as const;

export type LinkedinPostVariant =
  (typeof LinkedinPostVariant)[keyof typeof LinkedinPostVariant];
