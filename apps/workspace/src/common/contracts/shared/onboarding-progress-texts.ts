/** Wording of the progress over required answers; portal and CRM pass their own dictionary section. */
export interface OnboardingProgressTexts {
  /** Accessible name of the bar. */
  barLabel: string;
  /** Carries `{answered}` and `{total}`. */
  label: string;
  /** Shown when the form requires nothing. */
  none: string;
}
