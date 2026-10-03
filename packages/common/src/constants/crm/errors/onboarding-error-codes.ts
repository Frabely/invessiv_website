export const OnboardingErrorCode = {
  FormNotFound: "ONBOARDING_FORM_NOT_FOUND",
  ProjectNotFound: "ONBOARDING_PROJECT_NOT_FOUND",
  ProjectNotEligible: "ONBOARDING_PROJECT_NOT_ELIGIBLE",
  FormExists: "ONBOARDING_FORM_EXISTS",
  TemplateBlockArchived: "ONBOARDING_TEMPLATE_BLOCK_ARCHIVED",
  TemplateApplyUnavailable: "ONBOARDING_TEMPLATE_APPLY_UNAVAILABLE",
  InvalidTransition: "ONBOARDING_INVALID_TRANSITION",
  NotEditable: "ONBOARDING_NOT_EDITABLE",
  EmptyForm: "ONBOARDING_EMPTY_FORM",
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
