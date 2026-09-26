export const CustomSelectSize = {
  Default: "default",
  /** Only the leading symbol and the chevron are visible; the label stays the accessible name. */
  Compact: "compact",
} as const;

export type CustomSelectSize =
  (typeof CustomSelectSize)[keyof typeof CustomSelectSize];
