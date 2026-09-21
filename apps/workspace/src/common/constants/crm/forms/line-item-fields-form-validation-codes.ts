/**
 * Field-level codes for every form that edits a service offer — the catalog template and the
 * project line item share them, because both edit the same five fields under the same rules.
 */
export const LineItemFieldsFormValidationCode = {
  TitleRequired: "TITLE_REQUIRED",
  PriceInvalid: "PRICE_INVALID",
  PriceOutOfRange: "PRICE_OUT_OF_RANGE",
  RecurringIntervalRequired: "RECURRING_INTERVAL_REQUIRED",
} as const;

export type LineItemFieldsFormValidationCode =
  (typeof LineItemFieldsFormValidationCode)[keyof typeof LineItemFieldsFormValidationCode];
