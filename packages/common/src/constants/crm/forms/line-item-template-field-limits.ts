/** Shared by the server schema and the dialog's `maxLength`, so both reject the same input. */
export const LineItemTemplateFieldLimits = {
  TitleMaxLength: 200,
  DescriptionMaxLength: 4000,
  /** Not a business cap: `price_cents` is a Postgres 4-byte `integer` column; this is its ceiling. */
  PriceCentsMax: 2_147_483_647,
} as const;

export type LineItemTemplateFieldLimit =
  (typeof LineItemTemplateFieldLimits)[keyof typeof LineItemTemplateFieldLimits];
