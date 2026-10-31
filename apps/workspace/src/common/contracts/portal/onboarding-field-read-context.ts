import type { OnboardingFieldFormContext } from "./onboarding-field-form-context";

/** Field data shared by the editor and the reader, without commands or autosave state. */
export type OnboardingFieldReadContext = Pick<
  OnboardingFieldFormContext,
  | "answerFiles"
  | "hiddenAnswerFiles"
  | "content"
  | "drafts"
  | "input"
  | "locale"
  | "services"
  | "servicesNote"
>;
