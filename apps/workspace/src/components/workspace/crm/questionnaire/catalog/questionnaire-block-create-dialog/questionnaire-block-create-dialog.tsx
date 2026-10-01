"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent, useId, useRef, useState } from "react";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormDialog } from "@invessiv/ui";
import { questionnaireCatalogApiService } from "@/client/crm/questionnaire-catalog-api-service";
import type {
  QuestionnaireBlockIdentity,
  QuestionnaireBlockIdentityErrors,
} from "@/common/contracts/crm/questionnaire/questionnaire-block-identity";
import { validateQuestionnaireBlockIdentity } from "@/common/patterns/crm/questionnaire/questionnaire-block-identity";
import { questionnaireFailureCode } from "@/common/patterns/crm/questionnaire/questionnaire-client-failure";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { crmQuestionnaireBlockPathFor } from "@/lib/auth/routes";
import { QuestionnaireBlockIdentityFields } from "../../block-list/questionnaire-block-identity-fields/questionnaire-block-identity-fields";
import { QuestionnaireCheckboxField } from "../../editor/questionnaire-checkbox-field/questionnaire-checkbox-field";
import styles from "./questionnaire-block-create-dialog.module.css";

export type QuestionnaireBlockCreateDialogProps = {
  closeHref: string;
  content: CrmQuestionnaireDictionary;
  locale: Locale;
};

/** The title is written in the editor's own language; further languages follow in the editor. */
export function QuestionnaireBlockCreateDialog({
  closeHref,
  content,
  locale,
}: QuestionnaireBlockCreateDialogProps) {
  const router = useRouter();
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [identity, setIdentity] = useState<QuestionnaireBlockIdentity>({
    title: "",
    key: "",
  });
  const [carryOver, setCarryOver] = useState(false);
  const [errors, setErrors] = useState<QuestionnaireBlockIdentityErrors>({});
  const [failure, setFailure] = useState<QuestionnaireErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const texts = content.catalog.createBlockDialog;

  function close() {
    router.replace(closeHref, { scroll: false });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const next = validateQuestionnaireBlockIdentity(identity);
    setErrors(next);
    if (next.title || next.key) {
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    setFailure(null);
    const result = await questionnaireCatalogApiService.createBlock({
      key: identity.key,
      carryOver,
      translations: {
        [locale]: { title: identity.title.trim(), intro: null },
      },
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
        <QuestionnaireBlockIdentityFields
          errors={errors}
          keyHint={texts.hints.key}
          keyLabel={texts.fields.key}
          onChangeAction={setIdentity}
          titleLabel={formatMessage(texts.fields.title, {
            language: languageName(locale, locale),
          })}
          titleRef={titleRef}
          validation={content.catalog.validation}
          value={identity}
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
