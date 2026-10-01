/** One option of a choice field with its label resolved for a reader. */
export interface QuestionnaireResolvedChoice {
  /** Choice id; answers and conditions reference this value, never the label. */
  id: string;
  /** Display order within the field, starting at 0. */
  position: number;
  /** Label in the requested locale, or in the first maintained one. */
  label: string;
}
