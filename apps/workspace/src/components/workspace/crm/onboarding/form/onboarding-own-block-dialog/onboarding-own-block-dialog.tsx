"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import { FormDialog } from "@invessiv/ui";
import type { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import type {
  QuestionnaireBlockIdentity,
  QuestionnaireBlockIdentityErrors,
} from "@/common/contracts/crm/questionnaire/questionnaire-block-identity";
import { validateQuestionnaireBlockIdentity } from "@/common/patterns/crm/questionnaire/questionnaire-block-identity";
import { QuestionnaireBlockIdentityFields } from "@/components/workspace/crm/questionnaire/block-list/questionnaire-block-identity-fields/questionnaire-block-identity-fields";
import type { Locale } from "@/config/i18n";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-own-block-dialog.module.css";

export type OnboardingOwnBlockDialogProps = {
  busy: boolean;
  content: CrmOnboardingDictionary["structure"]["ownDialog"];
  /** Text of the last refused attempt; the input stays as it was. */
  failure: string | null;
  locale: Locale;
  onCloseAction: () => void;
  onSubmitAction: (identity: QuestionnaireBlockIdentity) => void;
  validation: Readonly<Record<QuestionnaireFormValidationCode, string>>;
};

/**
 * Title and key of a block that exists only in this form. The title is written in the editor's
 * own language; fields and further languages follow in the block editor.
 */
export function OnboardingOwnBlockDialog({
  busy,
  content,
  failure,
  locale,
  onCloseAction,
  onSubmitAction,
  validation,
}: OnboardingOwnBlockDialogProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [identity, setIdentity] = useState<QuestionnaireBlockIdentity>({
    title: "",
    key: "",
  });
  const [errors, setErrors] = useState<QuestionnaireBlockIdentityErrors>({});

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const next = validateQuestionnaireBlockIdentity(identity);
    setErrors(next);
    if (next.title || next.key) {
      titleRef.current?.focus();
      return;
    }
    onSubmitAction({ title: identity.title.trim(), key: identity.key });
  }

  return (
    <FormDialog
      busy={busy}
      cancelLabel={content.cancel}
      closeLabel={content.close}
      description={content.description}
      formId={formId}
      initialFocusRef={titleRef}
      onCloseAction={onCloseAction}
      submitLabel={content.submit}
      submittingLabel={content.submitting}
      title={content.title}
    >
      <form className={styles.form} id={formId} noValidate onSubmit={submit}>
        {failure ? (
          <p className={styles.failure} role="alert">
            {failure}
          </p>
        ) : null}
        <QuestionnaireBlockIdentityFields
          errors={errors}
          keyHint={content.hints.key}
          keyLabel={content.fields.key}
          onChangeAction={setIdentity}
          titleLabel={formatMessage(content.fields.title, {
            language: languageName(locale, locale),
          })}
          titleRef={titleRef}
          validation={validation}
          value={identity}
        />
      </form>
    </FormDialog>
  );
}
