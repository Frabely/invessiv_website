"use client";

import { type RefObject, useState } from "react";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FormField } from "@invessiv/ui";
import type { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import type {
  QuestionnaireBlockIdentity,
  QuestionnaireBlockIdentityErrors,
} from "@/common/contracts/crm/questionnaire/questionnaire-block-identity";
import { suggestQuestionnaireKey } from "@/common/patterns/crm/questionnaire/questionnaire-key-suggestion";

export type QuestionnaireBlockIdentityFieldsProps = {
  errors: QuestionnaireBlockIdentityErrors;
  keyHint: string;
  keyLabel: string;
  onChangeAction: (identity: QuestionnaireBlockIdentity) => void;
  titleLabel: string;
  titleRef: RefObject<HTMLInputElement | null>;
  validation: Readonly<Record<QuestionnaireFormValidationCode, string>>;
  value: QuestionnaireBlockIdentity;
};

/**
 * Title and key of a new block, for the catalog and for a form alike. The key follows the title
 * until someone edits it by hand.
 */
export function QuestionnaireBlockIdentityFields({
  errors,
  keyHint,
  keyLabel,
  onChangeAction,
  titleLabel,
  titleRef,
  validation,
  value,
}: QuestionnaireBlockIdentityFieldsProps) {
  const [keyEdited, setKeyEdited] = useState(false);

  return (
    <>
      <FormField
        errorMessage={errors.title ? validation[errors.title] : undefined}
        inputProps={{
          maxLength: QUESTIONNAIRE_LIMITS.titleMaxLength,
          name: "questionnaire-block-title",
          onChange: (event) =>
            onChangeAction({
              title: event.target.value,
              key: keyEdited
                ? value.key
                : suggestQuestionnaireKey(event.target.value),
            }),
          value: value.title,
        }}
        inputRef={titleRef}
        kind={FormFieldKind.Text}
        label={titleLabel}
        required
      />
      <FormField
        errorMessage={errors.key ? validation[errors.key] : undefined}
        hint={keyHint}
        inputProps={{
          autoCapitalize: "off",
          autoComplete: "off",
          maxLength: QUESTIONNAIRE_LIMITS.keyMaxLength,
          name: "questionnaire-block-key",
          onChange: (event) => {
            setKeyEdited(true);
            onChangeAction({ title: value.title, key: event.target.value });
          },
          spellCheck: false,
          value: value.key,
        }}
        kind={FormFieldKind.Text}
        label={keyLabel}
        required
      />
    </>
  );
}
