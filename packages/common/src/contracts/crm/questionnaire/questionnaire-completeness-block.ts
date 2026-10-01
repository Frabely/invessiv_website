import type { QuestionnaireCompletenessField } from "./questionnaire-completeness-field";

/** What `getQuestionnaireCompleteness` reads of a block. */
export interface QuestionnaireCompletenessBlock {
  id: string;
  /** Block-level fields; group sub-fields sit in `children`. */
  fields: readonly QuestionnaireCompletenessField[];
}
