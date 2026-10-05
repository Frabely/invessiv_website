/** How much of a row a question takes in the portal form, once the step is wide enough for columns. */
export const OnboardingFieldSpan = {
  /** One column: short inputs. */
  Narrow: "narrow",
  /** Two columns: long text and anything that needs room to read. */
  Wide: "wide",
  /** The whole row: questions that bring their own layout. */
  Full: "full",
} as const;

export type OnboardingFieldSpan =
  (typeof OnboardingFieldSpan)[keyof typeof OnboardingFieldSpan];

export const ONBOARDING_FIELD_SPAN_VALUES = [
  OnboardingFieldSpan.Narrow,
  OnboardingFieldSpan.Wide,
  OnboardingFieldSpan.Full,
] as const;
