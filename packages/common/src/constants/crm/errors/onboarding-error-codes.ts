export const OnboardingErrorCode = {
  FormNotFound: "ONBOARDING_FORM_NOT_FOUND",
  TemplateNotFound: "ONBOARDING_TEMPLATE_NOT_FOUND",
  BlockNotFound: "ONBOARDING_BLOCK_NOT_FOUND",
  FieldNotFound: "ONBOARDING_FIELD_NOT_FOUND",
  FormExists: "ONBOARDING_FORM_EXISTS",
  InvalidTransition: "ONBOARDING_INVALID_TRANSITION",
  NotEditable: "ONBOARDING_NOT_EDITABLE",
  TranslationRequired: "ONBOARDING_TRANSLATION_REQUIRED",
  InvalidCondition: "ONBOARDING_INVALID_CONDITION",
  InvalidFieldConfig: "ONBOARDING_INVALID_FIELD_CONFIG",
  BlockInUse: "ONBOARDING_BLOCK_IN_USE",
  RequiredMissing: "ONBOARDING_REQUIRED_MISSING",
  ReviewIncomplete: "ONBOARDING_REVIEW_INCOMPLETE",
  CallDateRequired: "ONBOARDING_CALL_DATE_REQUIRED",
  LimitReached: "ONBOARDING_LIMIT_REACHED",
  FileNotAttachable: "ONBOARDING_FILE_NOT_ATTACHABLE",
  ValidationError: "VALIDATION_ERROR",
} as const;

export type OnboardingErrorCode =
  (typeof OnboardingErrorCode)[keyof typeof OnboardingErrorCode];

export const ONBOARDING_ERROR_CODE_VALUES = Object.values(
  OnboardingErrorCode,
) as readonly OnboardingErrorCode[];
