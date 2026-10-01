import type { QuestionnaireBlockProgress } from "./questionnaire-block-progress";
import type { QuestionnaireMissingField } from "./questionnaire-missing-field";
import type { QuestionnaireProgressDto } from "./questionnaire-progress.dto";

/** Result of `getQuestionnaireCompleteness`; a form may be submitted exactly when `missing` is empty. */
export interface QuestionnaireCompleteness extends QuestionnaireProgressDto {
  /** Missing fields in form order. */
  missing: readonly QuestionnaireMissingField[];
  /** Progress per block in form order. */
  blocks: readonly QuestionnaireBlockProgress[];
}
