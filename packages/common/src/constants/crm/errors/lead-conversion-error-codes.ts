export const LeadConversionErrorCode = {
  DisplayNameTaken: "LEAD_CONVERSION_DISPLAY_NAME_TAKEN",
  Internal: "LEAD_CONVERSION_INTERNAL",
  LeadNotFound: "LEAD_CONVERSION_LEAD_NOT_FOUND",
  OwnerInactive: "LEAD_CONVERSION_OWNER_INACTIVE",
  ValidationError: "LEAD_CONVERSION_VALIDATION_ERROR",
} as const;

export type LeadConversionErrorCode =
  (typeof LeadConversionErrorCode)[keyof typeof LeadConversionErrorCode];

export const LEAD_CONVERSION_ERROR_CODE_VALUES = Object.values(
  LeadConversionErrorCode,
);
