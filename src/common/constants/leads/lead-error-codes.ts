export const LeadErrorCode = {
  EmailExists: "EMAIL_EXISTS",
  ValidationError: "VALIDATION_ERROR",
  NotFound: "NOT_FOUND",
} as const;

export type LeadErrorCode = (typeof LeadErrorCode)[keyof typeof LeadErrorCode];
