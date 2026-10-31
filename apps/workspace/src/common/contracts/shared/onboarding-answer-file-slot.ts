import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";

/** Ordered readable files and the number of inaccessible links for one answer slot. */
export interface OnboardingAnswerFileSlot {
  links: readonly QuestionnaireAnswerFileDto[];
  attachments: readonly FileAttachmentDto[];
  hiddenCount: number;
}
