export const ServiceRequestErrorCode = {
  ServiceRequestNotFound: "SERVICE_REQUEST_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  InvalidTransition: "INVALID_TRANSITION",
  VersionConflict: "VERSION_CONFLICT",
  KindMismatch: "KIND_MISMATCH",
  TemplateNotAssignable: "TEMPLATE_NOT_ASSIGNABLE",
  ProjectNotFound: "PROJECT_NOT_FOUND",
  EffectNotPermitted: "EFFECT_NOT_PERMITTED",
  ProjectClosed: "PROJECT_CLOSED",
  FeedbackRoundNotAvailable: "FEEDBACK_ROUND_NOT_AVAILABLE",
  Internal: "INTERNAL",
} as const;
export type ServiceRequestErrorCode =
  (typeof ServiceRequestErrorCode)[keyof typeof ServiceRequestErrorCode];
export const SERVICE_REQUEST_ERROR_CODE_VALUES = Object.values(
  ServiceRequestErrorCode,
);
