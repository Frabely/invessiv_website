import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireAnswerFileRefDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file-ref.dto";
import type { OnboardingAnswerFileSlot } from "@/common/contracts/shared/onboarding-answer-file-slot";

/** Selects a slot without mutating the form's arrays or revealing hidden file details. */
export function getOnboardingAnswerFileSlot(
  answerFiles: readonly QuestionnaireAnswerFileDto[],
  hiddenAnswerFiles: readonly QuestionnaireAnswerFileRefDto[],
  slot: QuestionnaireAnswerFileRefDto,
): OnboardingAnswerFileSlot {
  const matches = (link: QuestionnaireAnswerFileRefDto) =>
    link.fieldId === slot.fieldId && link.groupEntryId === slot.groupEntryId;
  const links = answerFiles
    .filter(matches)
    .sort((left, right) => left.position - right.position);
  return {
    links,
    attachments: links.map((link) => link.file),
    hiddenCount: hiddenAnswerFiles.filter(matches).length,
  };
}
