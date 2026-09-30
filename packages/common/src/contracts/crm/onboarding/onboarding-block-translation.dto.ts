/** The texts of one block in one locale. */
export interface OnboardingBlockTranslationDto {
  /** Step title in the portal; never empty. */
  title: string;
  /** Hint above the step's fields; null when the block needs none. */
  intro: string | null;
}
