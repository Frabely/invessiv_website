import type { QuestionnaireAnswerFileRefDto } from "./questionnaire-answer-file-ref.dto";
import type { QuestionnaireAnswerDto } from "./questionnaire-answer.dto";
import type { QuestionnaireCompletenessBlock } from "./questionnaire-completeness-block";
import type { QuestionnaireGroupEntryDto } from "./questionnaire-group-entry.dto";

/** Everything `getQuestionnaireCompleteness` reads; portal, CRM, submit and completion pass the same shape. */
export interface QuestionnaireCompletenessInput {
  /** Blocks in form order. */
  blocks: readonly QuestionnaireCompletenessBlock[];
  answers: readonly QuestionnaireAnswerDto[];
  answerFiles: readonly QuestionnaireAnswerFileRefDto[];
  groupEntries: readonly QuestionnaireGroupEntryDto[];
  /** Whether the customer confirmed the booked services; answers a `project_services` field. */
  servicesConfirmed: boolean;
}
