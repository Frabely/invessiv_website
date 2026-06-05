/**
 * Form fields of the gated lead-capture step. Used both as inline-error keys
 * (see LeadCaptureFieldErrors) and as clearError targets in the UI, so the field
 * identifiers live in exactly one place instead of repeated string literals.
 */
export const LeadCaptureFieldName = {
  DisplayName: "displayName",
  Email: "email",
  ConsentDelivery: "consentDelivery",
} as const;

export type LeadCaptureFieldName =
  (typeof LeadCaptureFieldName)[keyof typeof LeadCaptureFieldName];
