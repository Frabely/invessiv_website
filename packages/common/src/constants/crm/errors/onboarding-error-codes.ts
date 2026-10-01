export const OnboardingErrorCode = {
  FormNotFound: "ONBOARDING_FORM_NOT_FOUND",
  ProjectNotFound: "ONBOARDING_PROJECT_NOT_FOUND",
  ProjectNotEligible: "ONBOARDING_PROJECT_NOT_ELIGIBLE",
  FormExists: "ONBOARDING_FORM_EXISTS",
  InvalidTransition: "ONBOARDING_INVALID_TRANSITION",
  NotEditable: "ONBOARDING_NOT_EDITABLE",
  RequiredMissing: "ONBOARDING_REQUIRED_MISSING",
  ReviewIncomplete: "ONBOARDING_REVIEW_INCOMPLETE",
  CallDateRequired: "ONBOARDING_CALL_DATE_REQUIRED",
  FileNotAttachable: "ONBOARDING_FILE_NOT_ATTACHABLE",
  ReleaseWarnings: "ONBOARDING_RELEASE_WARNINGS",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type OnboardingErrorCode =
  (typeof OnboardingErrorCode)[keyof typeof OnboardingErrorCode];

export const ONBOARDING_ERROR_CODE_VALUES = Object.values(
  OnboardingErrorCode,
) as readonly OnboardingErrorCode[];
