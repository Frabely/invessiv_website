export const ServiceTemplateErrorCode = {
  ServiceTemplateNotFound: "SERVICE_TEMPLATE_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type ServiceTemplateErrorCode =
  (typeof ServiceTemplateErrorCode)[keyof typeof ServiceTemplateErrorCode];

export const SERVICE_TEMPLATE_ERROR_CODE_VALUES = Object.values(
  ServiceTemplateErrorCode,
) as readonly ServiceTemplateErrorCode[];
