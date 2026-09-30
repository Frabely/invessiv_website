/** Why `validateOnboardingValue` rejected a raw value; the UI maps each code to a dictionary text. */
export const OnboardingValueErrorCode = {
  Empty: "empty",
  TooLong: "too_long",
  InvalidEmail: "invalid_email",
  InvalidPhone: "invalid_phone",
  InvalidUrl: "invalid_url",
  InvalidColor: "invalid_color",
  InvalidScale: "invalid_scale",
  NotConfirmed: "not_confirmed",
  NotAValueField: "not_a_value_field",
} as const;

export type OnboardingValueErrorCode =
  (typeof OnboardingValueErrorCode)[keyof typeof OnboardingValueErrorCode];

export const ONBOARDING_VALUE_ERROR_CODE_VALUES = [
  OnboardingValueErrorCode.Empty,
  OnboardingValueErrorCode.TooLong,
  OnboardingValueErrorCode.InvalidEmail,
  OnboardingValueErrorCode.InvalidPhone,
  OnboardingValueErrorCode.InvalidUrl,
  OnboardingValueErrorCode.InvalidColor,
  OnboardingValueErrorCode.InvalidScale,
  OnboardingValueErrorCode.NotConfirmed,
  OnboardingValueErrorCode.NotAValueField,
] as const;
