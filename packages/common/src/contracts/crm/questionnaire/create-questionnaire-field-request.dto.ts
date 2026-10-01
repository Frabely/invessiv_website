import type { QuestionnaireFieldType } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireFieldInputDto } from "./questionnaire-field-input.dto";

/** Appends a field to the block or, with `parentFieldId`, to one of its groups. */
export interface CreateQuestionnaireFieldRequestDto extends QuestionnaireFieldInputDto {
  /** Decides rendering and storage; it cannot change later. */
  type: QuestionnaireFieldType;
  /** Group field of the same block; null places the field on block level. */
  parentFieldId: string | null;
  /** Block version the client last read; every field change bumps it. */
  expectedBlockVersion: number;
}
