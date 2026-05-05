export const LeadErrorCode = {
  EmailExists: "EMAIL_EXISTS",
  ValidationError: "VALIDATION_ERROR",
} as const;

export type LeadErrorCode = (typeof LeadErrorCode)[keyof typeof LeadErrorCode];
