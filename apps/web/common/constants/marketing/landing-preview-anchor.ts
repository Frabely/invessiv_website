/**
 * Identifies a demo-page location referenced by a problem-solution row.
 * `LANDING_PREVIEW_ANCHOR_ORDER` defines the row order.
 */
export const LandingPreviewAnchor = {
  Headline: "headline",
  Cta: "cta",
  Offer: "offer",
  Trust: "trust",
  Form: "form",
} as const;

export type LandingPreviewAnchor =
  (typeof LandingPreviewAnchor)[keyof typeof LandingPreviewAnchor];

export const LANDING_PREVIEW_ANCHOR_ORDER = [
  LandingPreviewAnchor.Headline,
  LandingPreviewAnchor.Cta,
  LandingPreviewAnchor.Offer,
  LandingPreviewAnchor.Trust,
  LandingPreviewAnchor.Form,
] as const satisfies readonly LandingPreviewAnchor[];
