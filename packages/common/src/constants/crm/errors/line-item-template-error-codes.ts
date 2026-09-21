export const LineItemTemplateErrorCode = {
  LineItemTemplateNotFound: "LINE_ITEM_TEMPLATE_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type LineItemTemplateErrorCode =
  (typeof LineItemTemplateErrorCode)[keyof typeof LineItemTemplateErrorCode];

export const LINE_ITEM_TEMPLATE_ERROR_CODE_VALUES = Object.values(
  LineItemTemplateErrorCode,
) as readonly LineItemTemplateErrorCode[];
