"use client";

import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CheckboxControl } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { OnboardingOptionGroup } from "../onboarding-option-group/onboarding-option-group";
import styles from "./onboarding-multi-choice-field.module.css";

export type OnboardingMultiChoiceFieldProps = {
  field: QuestionnaireResolvedField;
  /** DOM id of the first option; a jump to this field focuses it. */
  id: string;
  onChangeAction: (choiceIds: string[]) => void;
  selected: readonly string[];
  texts: PortalOnboardingDictionary["field"];
};

/** Several options out of a list. Once the field's maximum is reached, the rest is locked. */
export function OnboardingMultiChoiceField({
  field,
  id,
  onChangeAction,
  selected,
  texts,
}: OnboardingMultiChoiceFieldProps) {
  const full = field.maxItems !== null && selected.length >= field.maxItems;

  /** Sent in display order, whatever order the options were ticked in. */
  function toggle(choiceId: string) {
    const next = new Set(selected);
    if (next.has(choiceId)) next.delete(choiceId);
    else next.add(choiceId);
    onChangeAction(
      field.choices
        .filter((choice) => next.has(choice.id))
        .map((choice) => choice.id),
    );
  }

  return (
    <OnboardingOptionGroup
      footer={
        field.maxItems !== null ? (
          <p className={styles.limit}>
            {formatMessage(texts.maxChoices, { max: field.maxItems })}
          </p>
        ) : undefined
      }
      help={field.help}
      label={field.label}
      required={field.requirement === QuestionnaireFieldRequirement.Required}
    >
      {field.choices.map((choice, index) => {
        const checked = selected.includes(choice.id);
        return (
          <label key={choice.id}>
            <CheckboxControl
              checked={checked}
              disabled={full && !checked}
              id={index === 0 ? id : undefined}
              onChange={() => toggle(choice.id)}
            />
            <span>{choice.label}</span>
          </label>
        );
      })}
    </OnboardingOptionGroup>
  );
}
