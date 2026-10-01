"use client";

import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { validateQuestionnaireValue } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-field-value";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormField } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import styles from "./onboarding-color-field.module.css";

// What the native picker shows while the field holds no valid colour yet.
const PICKER_FALLBACK = "#000000";

export type OnboardingColorFieldProps = {
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

/**
 * A colour as hex text with the native picker next to it. Both write the same value; the picker
 * doubles as the preview and keeps its own border, so a white or black colour stays visible.
 */
export function OnboardingColorField({
  errorMessage,
  field,
  id,
  onChangeAction,
  onCommitAction,
  texts,
  value,
}: OnboardingColorFieldProps) {
  const required = field.requirement === QuestionnaireFieldRequirement.Required;
  const valid = value !== "" && validateQuestionnaireValue(field, value).ok;

  return (
    <FormField
      errorMessage={errorMessage ?? undefined}
      hint={field.help ?? undefined}
      inputProps={{
        "aria-required": required,
        autoCapitalize: "characters",
        autoComplete: "off",
        id,
        maxLength: 7,
        onBlur: onCommitAction,
        onChange: (event) => onChangeAction(event.target.value),
        placeholder: texts.color.placeholder,
        spellCheck: false,
        value,
      }}
      inputSuffix={
        <input
          aria-label={formatMessage(texts.color.pickerLabel, {
            field: field.label,
          })}
          className={styles.picker}
          data-empty={valid ? undefined : "true"}
          onChange={(event) =>
            onChangeAction(event.target.value, { immediate: true })
          }
          type="color"
          value={valid ? value.trim() : PICKER_FALLBACK}
        />
      }
      kind={FormFieldKind.Text}
      label={field.label}
      required={required}
    />
  );
}
