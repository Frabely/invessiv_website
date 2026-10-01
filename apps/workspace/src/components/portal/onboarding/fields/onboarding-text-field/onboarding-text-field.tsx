"use client";

import {
  FormFieldKind,
  type FormFieldKind as FormFieldKindValue,
} from "@invessiv/common/constants/form/form-field-kinds";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { getQuestionnaireValueMaxLength } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-field-value";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormField } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import styles from "./onboarding-text-field.module.css";

type SingleLineKind = Exclude<
  FormFieldKindValue,
  | typeof FormFieldKind.Custom
  | typeof FormFieldKind.Select
  | typeof FormFieldKind.Textarea
>;

// The input type decides the keyboard on phones and what the browser offers to fill in.
const SINGLE_LINE_KINDS: Partial<
  Record<QuestionnaireFieldType, SingleLineKind>
> = {
  [QuestionnaireFieldType.ShortText]: FormFieldKind.Text,
  [QuestionnaireFieldType.Email]: FormFieldKind.Email,
  [QuestionnaireFieldType.Phone]: FormFieldKind.Tel,
  [QuestionnaireFieldType.Url]: FormFieldKind.Url,
};

// The counter appears when the limit comes into view, not from the first character.
const COUNTER_FROM_RATIO = 0.8;

export type OnboardingTextFieldProps = {
  /** Why the typed text is not saved, already worded; null while it is fine. */
  errorMessage: string | null;
  field: QuestionnaireResolvedField;
  /** DOM id of the input; a jump to this field focuses it. */
  id: string;
  onChangeAction: (value: string) => void;
  /** The field was left; what was typed is saved without waiting. */
  onCommitAction: () => void;
  texts: PortalOnboardingDictionary["field"];
  value: string;
};

/** Short and long text, e-mail, phone and link. Invalid text stays in the input with its reason. */
export function OnboardingTextField({
  errorMessage,
  field,
  id,
  onChangeAction,
  onCommitAction,
  texts,
  value,
}: OnboardingTextFieldProps) {
  const required = field.requirement === QuestionnaireFieldRequirement.Required;
  const maxLength = getQuestionnaireValueMaxLength(field);
  const counter =
    maxLength !== null && value.length >= maxLength * COUNTER_FROM_RATIO
      ? formatMessage(texts.characters, { count: value.length, max: maxLength })
      : null;
  const hint =
    field.help || counter ? (
      <>
        {field.help ? <span className={styles.help}>{field.help}</span> : null}
        {counter ? <span className={styles.counter}>{counter}</span> : null}
      </>
    ) : undefined;
  const shared = {
    errorMessage: errorMessage ?? undefined,
    hint,
    label: field.label,
    required,
  };
  const control = {
    "aria-required": required,
    id,
    onBlur: onCommitAction,
    value,
  };
  const kind = SINGLE_LINE_KINDS[field.type];

  return kind ? (
    <FormField
      {...shared}
      inputProps={{
        ...control,
        onChange: (event) => onChangeAction(event.target.value),
      }}
      kind={kind}
    />
  ) : (
    <FormField
      {...shared}
      kind={FormFieldKind.Textarea}
      textareaProps={{
        ...control,
        onChange: (event) => onChangeAction(event.target.value),
      }}
    />
  );
}
