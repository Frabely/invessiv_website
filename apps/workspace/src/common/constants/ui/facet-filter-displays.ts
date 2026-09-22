/**
 * How a facet offers its values. `chips` shows one badge per value and switches to a select on
 * small screens; `select` always shows the select, for facets whose value list has no upper bound.
 */
export const FacetFilterDisplay = {
  Chips: "chips",
  Select: "select",
} as const;

export type FacetFilterDisplay =
  (typeof FacetFilterDisplay)[keyof typeof FacetFilterDisplay];

export const FACET_FILTER_DISPLAY_VALUES = [
  FacetFilterDisplay.Chips,
  FacetFilterDisplay.Select,
] as const;
