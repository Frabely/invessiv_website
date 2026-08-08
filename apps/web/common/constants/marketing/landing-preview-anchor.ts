/**
 * Identifies a demo-page location referenced by a problem-solution row.
 * `LANDING_PREVIEW_ANCHOR_ORDER` defines the row order and follows the demo
 * page from top to bottom, so stepping through the rows pans it downwards.
 */
export const LandingPreviewAnchor = {
  Headline: "headline",
  Cta: "cta",
  Problems: "problems",
  Offer: "offer",
  Form: "form",
} as const;

export type LandingPreviewAnchor =
  (typeof LandingPreviewAnchor)[keyof typeof LandingPreviewAnchor];

export const LANDING_PREVIEW_ANCHOR_ORDER = [
  LandingPreviewAnchor.Headline,
  LandingPreviewAnchor.Cta,
  LandingPreviewAnchor.Problems,
  LandingPreviewAnchor.Offer,
  LandingPreviewAnchor.Form,
] as const satisfies readonly LandingPreviewAnchor[];
