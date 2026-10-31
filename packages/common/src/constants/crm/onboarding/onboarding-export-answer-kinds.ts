/**
 * How an exported answer is shaped; several field types share one shape (all texts, all choices,
 * a confirmation box and the service confirmation).
 */
export const OnboardingExportAnswerKind = {
  Text: "text",
  Choice: "choice",
  Scale: "scale",
  Confirmation: "confirmation",
  Files: "files",
  Group: "group",
} as const;

export type OnboardingExportAnswerKind =
  (typeof OnboardingExportAnswerKind)[keyof typeof OnboardingExportAnswerKind];

export const ONBOARDING_EXPORT_ANSWER_KIND_VALUES = [
  OnboardingExportAnswerKind.Text,
  OnboardingExportAnswerKind.Choice,
  OnboardingExportAnswerKind.Scale,
  OnboardingExportAnswerKind.Confirmation,
  OnboardingExportAnswerKind.Files,
  OnboardingExportAnswerKind.Group,
] as const;
