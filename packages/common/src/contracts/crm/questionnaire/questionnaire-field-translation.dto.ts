/** The texts of one field in one locale. */
export interface QuestionnaireFieldTranslationDto {
  /** Question shown above the input; never empty. */
  label: string;
  /** Explanation below the label; null when the field needs none. */
  help: string | null;
}
