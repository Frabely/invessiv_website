import type { QuestionnaireFieldDto } from "./questionnaire-field.dto";

/**
 * What `getQuestionnaireCompleteness` reads of a field. The full definition and the portal's
 * reduced field both fit, so server and portal client run the same rules on their own shapes.
 */
export interface QuestionnaireCompletenessField extends Pick<
  QuestionnaireFieldDto,
  | "id"
  | "blockId"
  | "parentFieldId"
  | "position"
  | "type"
  | "requirement"
  | "minItems"
  | "conditionFieldId"
  | "conditionChoiceId"
> {
  /** Sub-fields of a group; empty otherwise. */
  children: readonly QuestionnaireCompletenessField[];
}
