export const ProjectLineItemErrorCode = {
  ProjectLineItemNotFound: "PROJECT_LINE_ITEM_NOT_FOUND",
  ProjectNotFound: "PROJECT_NOT_FOUND",
  LineItemTemplateNotAssignable: "LINE_ITEM_TEMPLATE_NOT_ASSIGNABLE",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type ProjectLineItemErrorCode =
  (typeof ProjectLineItemErrorCode)[keyof typeof ProjectLineItemErrorCode];

export const PROJECT_LINE_ITEM_ERROR_CODE_VALUES = Object.values(
  ProjectLineItemErrorCode,
) as readonly ProjectLineItemErrorCode[];
