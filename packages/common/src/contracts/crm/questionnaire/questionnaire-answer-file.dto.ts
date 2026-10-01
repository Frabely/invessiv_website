import type { QuestionnaireAnswerFileRefDto } from "./questionnaire-answer-file-ref.dto";
import type { QuestionnaireAttachment } from "./questionnaire-attachment";

/** A file attached to a files field; the pre-fill may attach the same file to a second form. */
export interface QuestionnaireAnswerFileDto extends QuestionnaireAnswerFileRefDto {
  /** Order within the field and entry, starting at 0. */
  position: number;
  /** The attached file entry; it belongs to the form's customer. */
  file: QuestionnaireAttachment;
}
