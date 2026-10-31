"use client";

import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ColorField } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";

export type OnboardingColorFieldProps = {
  disabled?: boolean;
  /** Why the typed text is not saved, already worded; null while it is fine. */
  errorMessage: string | null;
  field: QuestionnaireResolvedField;
  /** DOM id of the hex input; a jump to this field focuses it. */
  id: string;
  /** `immediate` for a pick, where there is no typing to wait for. */
  onChangeAction: (value: string, options?: { immediate?: boolean }) => void;
  onCommitAction: () => void;
  texts: PortalOnboardingDictionary["field"];
  value: string;
};

export function OnboardingColorField({
  disabled = false,
  errorMessage,
  field,
  id,
  onChangeAction,
  onCommitAction,
  texts,
  value,
}: OnboardingColorFieldProps) {
  return (
    <ColorField
      disabled={disabled}
      errorMessage={errorMessage ?? undefined}
      hint={field.help ?? undefined}
      id={id}
      label={field.label}
      onBlurAction={onCommitAction}
      onChangeAction={onChangeAction}
      onPickAction={(picked) => onChangeAction(picked, { immediate: true })}
      pickerActionLabel={texts.color.pickerAction}
      pickerLabel={formatMessage(texts.color.pickerLabel, {
        field: field.label,
      })}
      placeholder={texts.color.placeholder}
      required={field.requirement === QuestionnaireFieldRequirement.Required}
      reserveErrorSpace={false}
      value={value}
    />
  );
}
