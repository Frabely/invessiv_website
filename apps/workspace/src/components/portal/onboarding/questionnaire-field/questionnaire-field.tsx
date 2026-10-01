"use client";

import React, { useEffect } from "react";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireValueErrorCode } from "@invessiv/common/constants/crm/questionnaire/questionnaire-value-error-codes";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { onboardingFieldDomId } from "@/common/patterns/portal/onboarding-field-dom-id";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { OnboardingChoiceField } from "../fields/onboarding-choice-field/onboarding-choice-field";
import { OnboardingMultiChoiceField } from "../fields/onboarding-multi-choice-field/onboarding-multi-choice-field";
import { OnboardingTextField } from "../fields/onboarding-text-field/onboarding-text-field";

export type QuestionnaireFieldProps = {
  /** Text of a value field as at most one entry, or the selected option ids. */
  entries: readonly string[];
  field: QuestionnaireResolvedField;
  /** Why the typed text is not saved; null while it is fine. */
  invalid: QuestionnaireValueErrorCode | null;
  onChangeAction: (
    entries: readonly string[],
    options?: { immediate?: boolean },
  ) => void;
  onCommitAction: () => void;
  texts: PortalOnboardingDictionary["field"];
};

/**
 * Picks the control for a field type. Rendering a type is code, so a type this form does not
 * know yet shows nothing instead of a broken input; development builds say so in the console.
 */
export function QuestionnaireField({
  entries,
  field,
  invalid,
  onChangeAction,
  onCommitAction,
  texts,
}: QuestionnaireFieldProps) {
  const id = onboardingFieldDomId(field.id);
  let control: React.ReactNode = null;

  switch (field.type) {
    case QuestionnaireFieldType.ShortText:
    case QuestionnaireFieldType.LongText:
    case QuestionnaireFieldType.Email:
    case QuestionnaireFieldType.Phone:
    case QuestionnaireFieldType.Url:
      control = (
        <OnboardingTextField
          errorMessage={invalid ? texts.errors[invalid] : null}
          field={field}
          id={id}
          onChangeAction={(value) => onChangeAction([value])}
          onCommitAction={onCommitAction}
          texts={texts}
          value={entries[0] ?? ""}
        />
      );
      break;
    case QuestionnaireFieldType.Choice:
    case QuestionnaireFieldType.YesNo:
      control = (
        <OnboardingChoiceField
          field={field}
          id={id}
          onChangeAction={(choiceIds) =>
            onChangeAction(choiceIds, { immediate: true })
          }
          selected={entries}
          texts={texts}
        />
      );
      break;
    case QuestionnaireFieldType.MultiChoice:
      control = (
        <OnboardingMultiChoiceField
          field={field}
          id={id}
          onChangeAction={(choiceIds) =>
            onChangeAction(choiceIds, { immediate: true })
          }
          selected={entries}
          texts={texts}
        />
      );
      break;
  }

  const unknown = control === null;
  useEffect(() => {
    if (unknown && process.env.NODE_ENV === "development")
      console.warn(`[onboarding] no control for field type "${field.type}"`);
  }, [field.type, unknown]);

  return control;
}
