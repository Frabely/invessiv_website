/**
 * Mirrors the `project_line_items` columns, not the catalog: a snapshot is edited independently of
 * its origin template, so the dialog and the server schema bound it on their own.
 */
export const ProjectLineItemFieldLimits = {
  TitleMaxLength: 200,
  DescriptionMaxLength: 4000,
  /** Not a business cap: `price_cents` is a Postgres 4-byte `integer` column; this is its ceiling. */
  PriceCentsMax: 2_147_483_647,
} as const;

export type ProjectLineItemFieldLimit =
  (typeof ProjectLineItemFieldLimits)[keyof typeof ProjectLineItemFieldLimits];
