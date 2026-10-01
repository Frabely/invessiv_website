"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent, useId, useRef, useState } from "react";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { FormDialog, FormField } from "@invessiv/ui";
import { questionnaireCatalogApiService } from "@/client/crm/questionnaire-catalog-api-service";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import { questionnaireFailureCode } from "@/common/patterns/crm/questionnaire/questionnaire-client-failure";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { crmQuestionnaireTemplatePathFor } from "@/lib/auth/routes";
import styles from "./questionnaire-template-create-dialog.module.css";

export type QuestionnaireTemplateCreateDialogProps = {
  closeHref: string;
  content: CrmQuestionnaireDictionary;
  locale: Locale;
};

/** An empty template; the blocks are chosen in the template editor it opens. */
export function QuestionnaireTemplateCreateDialog({
  closeHref,
  content,
  locale,
}: QuestionnaireTemplateCreateDialogProps) {
  const router = useRouter();
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] =
    useState<QuestionnaireFormValidationCode | null>(null);
  const [failure, setFailure] = useState<QuestionnaireErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const texts = content.catalog.createTemplateDialog;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!title.trim()) {
      setTitleError(QuestionnaireFormValidationCode.Required);
      titleRef.current?.focus();
      return;
    }
    setTitleError(null);
    setBusy(true);
    setFailure(null);
    const result = await questionnaireCatalogApiService.createTemplate({
      title: title.trim(),
      description: description.trim() || null,
    });
    if (result.ok) {
      router.push(crmQuestionnaireTemplatePathFor(locale, result.value.id));
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
      onCloseAction={() => router.replace(closeHref, { scroll: false })}
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
          errorMessage={
            titleError ? content.catalog.validation[titleError] : undefined
          }
          inputProps={{
            maxLength: QUESTIONNAIRE_LIMITS.titleMaxLength,
            name: "questionnaire-template-title",
            onChange: (event) => setTitle(event.target.value),
            value: title,
          }}
          inputRef={titleRef}
          kind={FormFieldKind.Text}
          label={texts.fields.title}
          required
        />
        <FormField
          hint={texts.hints.description}
          kind={FormFieldKind.Textarea}
          label={texts.fields.description}
          textareaProps={{
            maxLength: QUESTIONNAIRE_LIMITS.templateDescriptionMaxLength,
            name: "questionnaire-template-description",
            onChange: (event) => setDescription(event.target.value),
            rows: 3,
            value: description,
          }}
        />
      </form>
    </FormDialog>
  );
}
