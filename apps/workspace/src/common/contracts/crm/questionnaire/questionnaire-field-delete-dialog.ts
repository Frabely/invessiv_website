import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";

/**
 * What the block editor hands to an owner that replaces the delete confirmation, e.g. to say
 * what is lost together with the field.
 */
export type QuestionnaireFieldDeleteDialog = {
  field: QuestionnaireFieldDto;
  /** The field's label in the editor's language. */
  name: string;
  busy: boolean;
  onCancelAction: () => void;
  onConfirmAction: () => void;
};
