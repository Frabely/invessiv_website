import { getOnboardingAnswerFileSlot } from "@/common/patterns/shared/onboarding-answer-file-slot";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormFieldset } from "@invessiv/ui";
import type { OnboardingFieldReadContext } from "@/common/contracts/portal/onboarding-field-read-context";
import type { OnboardingReadFiles } from "@/common/contracts/shared/onboarding-read-files";
import { OnboardingReadAttachments } from "@/components/shared/onboarding/onboarding-read-attachments/onboarding-read-attachments";

export type OnboardingReadFilesFieldProps = {
  field: QuestionnaireResolvedField;
  files?: OnboardingReadFiles;
  form: OnboardingFieldReadContext;
  groupEntryId: string | null;
  id: string;
};

export function OnboardingReadFilesField({
  field,
  files,
  form,
  groupEntryId,
  id,
}: OnboardingReadFilesFieldProps) {
  const { attachments, hiddenCount } = getOnboardingAnswerFileSlot(
    form.answerFiles,
    form.hiddenAnswerFiles,
    { fieldId: field.id, groupEntryId },
  );
  const hidden = hiddenCount > 0;
  const texts = form.content.read;
  const required = field.requirement === QuestionnaireFieldRequirement.Required;

  return (
    <FormFieldset
      id={id}
      label={field.label}
      hint={field.help ?? undefined}
      required={required}
    >
      {attachments.length === 0 && !hidden ? (
        <p>{required ? texts.unanswered : texts.empty}</p>
      ) : null}
      <OnboardingReadAttachments
        attachments={attachments}
        files={files}
        hidden={hidden}
        hiddenText={texts.filesHidden}
        label={formatMessage(texts.filesLabel, { field: field.label })}
      />
    </FormFieldset>
  );
}
