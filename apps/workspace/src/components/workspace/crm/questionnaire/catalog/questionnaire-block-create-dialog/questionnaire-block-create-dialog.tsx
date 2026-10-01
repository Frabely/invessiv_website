"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent, useId, useRef, useState } from "react";
import { QUESTIONNAIRE_KEY_PATTERN_SOURCE } from "@invessiv/common/constants/crm/questionnaire/questionnaire-key-patterns";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormDialog, FormField } from "@invessiv/ui";
import { questionnaireCatalogApiService } from "@/client/crm/questionnaire-catalog-api-service";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import { suggestQuestionnaireKey } from "@/common/patterns/crm/questionnaire/questionnaire-key-suggestion";
import { questionnaireFailureCode } from "@/common/patterns/crm/questionnaire/questionnaire-client-failure";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { crmQuestionnaireBlockPathFor } from "@/lib/auth/routes";
import { QuestionnaireCheckboxField } from "../../editor/questionnaire-checkbox-field/questionnaire-checkbox-field";
import styles from "./questionnaire-block-create-dialog.module.css";

export type QuestionnaireBlockCreateDialogProps = {
  closeHref: string;
  content: CrmQuestionnaireDictionary;
  locale: Locale;
};

const KEY = new RegExp(QUESTIONNAIRE_KEY_PATTERN_SOURCE);

/** The title is written in the editor's own language; further languages follow in the editor. */
export function QuestionnaireBlockCreateDialog({
  closeHref,
  content,
  locale,
}: QuestionnaireBlockCreateDialogProps) {
  const router = useRouter();
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [keyEdited, setKeyEdited] = useState(false);
  const [carryOver, setCarryOver] = useState(false);
  const [errors, setErrors] = useState<{
    title?: QuestionnaireFormValidationCode;
    key?: QuestionnaireFormValidationCode;
  }>({});
  const [failure, setFailure] = useState<QuestionnaireErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const texts = content.catalog.createBlockDialog;
  const validation = content.catalog.validation;

  function close() {
    router.replace(closeHref, { scroll: false });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const next = {
      title: title.trim()
        ? undefined
        : QuestionnaireFormValidationCode.Required,
      key: !key
        ? QuestionnaireFormValidationCode.Required
        : KEY.test(key)
          ? undefined
          : QuestionnaireFormValidationCode.Key,
    };
    setErrors(next);
    if (next.title || next.key) {
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    setFailure(null);
    const result = await questionnaireCatalogApiService.createBlock({
      key,
      carryOver,
      translations: { [locale]: { title: title.trim(), intro: null } },
    });
    if (result.ok) {
      router.push(crmQuestionnaireBlockPathFor(locale, result.value.id));
      return;
    }
    setBusy(false);
    setFailure(questionnaireFailureCode(result));
  }

  return (
    <FormDialog
      busy={busy}
      cancelLabel={content.catalog.dialog.cancel}
      closeLabel={content.catalog.dialog.close}
      description={texts.description}
      formId={formId}
      initialFocusRef={titleRef}
      onCloseAction={close}
      submitLabel={texts.submit}
      submittingLabel={texts.submitting}
      title={texts.title}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        {failure ? (
          <p className={styles.failure} role="alert">
            {content.errors[failure]}
          </p>
        ) : null}
        <FormField
          errorMessage={errors.title ? validation[errors.title] : undefined}
          inputProps={{
            maxLength: QUESTIONNAIRE_LIMITS.titleMaxLength,
            name: "questionnaire-block-title",
            onChange: (event) => {
              setTitle(event.target.value);
              if (!keyEdited)
                setKey(suggestQuestionnaireKey(event.target.value));
            },
            value: title,
          }}
          inputRef={titleRef}
          kind={FormFieldKind.Text}
          label={formatMessage(texts.fields.title, {
            language: languageName(locale, locale),
          })}
          required
        />
        <FormField
          errorMessage={errors.key ? validation[errors.key] : undefined}
          hint={texts.hints.key}
          inputProps={{
            autoCapitalize: "off",
            autoComplete: "off",
            maxLength: QUESTIONNAIRE_LIMITS.keyMaxLength,
            name: "questionnaire-block-key",
            onChange: (event) => {
              setKey(event.target.value);
              setKeyEdited(true);
            },
            spellCheck: false,
            value: key,
          }}
          kind={FormFieldKind.Text}
          label={texts.fields.key}
          required
        />
        <QuestionnaireCheckboxField
          checked={carryOver}
          hint={texts.hints.carryOver}
          label={texts.fields.carryOver}
          onChangeAction={setCarryOver}
        />
      </form>
    </FormDialog>
  );
}
