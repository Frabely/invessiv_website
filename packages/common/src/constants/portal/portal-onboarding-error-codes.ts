export const PortalOnboardingErrorCode = {
  NotFound: "not_found",
  Locked: "locked",
  Validation: "validation",
  RequiredMissing: "required_missing",
  LimitReached: "limit_reached",
  NotAttachable: "not_attachable",
  Unavailable: "unavailable",
} as const;

export type PortalOnboardingErrorCode =
  (typeof PortalOnboardingErrorCode)[keyof typeof PortalOnboardingErrorCode];

export const PORTAL_ONBOARDING_ERROR_CODE_VALUES = [
  PortalOnboardingErrorCode.NotFound,
  PortalOnboardingErrorCode.Locked,
  PortalOnboardingErrorCode.Validation,
  PortalOnboardingErrorCode.RequiredMissing,
  PortalOnboardingErrorCode.LimitReached,
  PortalOnboardingErrorCode.NotAttachable,
  PortalOnboardingErrorCode.Unavailable,
] as const;
