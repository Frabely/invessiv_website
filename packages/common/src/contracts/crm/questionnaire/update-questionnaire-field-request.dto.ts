import type { QuestionnaireFieldInputDto } from "./questionnaire-field-input.dto";

/** Replaces configuration, texts and options of a field in one write. */
export interface UpdateQuestionnaireFieldRequestDto extends QuestionnaireFieldInputDto {
  /** Block version the client last read; every field change bumps it. */
  expectedBlockVersion: number;
}
