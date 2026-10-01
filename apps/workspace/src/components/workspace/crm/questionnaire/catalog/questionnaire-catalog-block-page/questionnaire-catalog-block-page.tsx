"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type SubmitEvent, useId, useRef, useState } from "react";
import {
  faArrowLeft,
  faClone,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QUESTIONNAIRE_KEY_PATTERN_SOURCE } from "@invessiv/common/constants/crm/questionnaire/questionnaire-key-patterns";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { missingQuestionnaireLocales } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  ConfirmDialog,
  FormDialog,
  FormField,
} from "@invessiv/ui";
import { questionnaireCatalogApiService } from "@/client/crm/questionnaire-catalog-api-service";
import {
  QUESTIONNAIRE_BLOCK_PAGE_DIALOG_VALUES,
  QuestionnaireBlockPageDialog,
} from "@/common/constants/crm/questionnaire/questionnaire-block-page-dialogs";
import { QuestionnaireEditorQueryParam } from "@/common/constants/crm/questionnaire/questionnaire-editor-query-params";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import { questionnaireFailureCode } from "@/common/patterns/crm/questionnaire/questionnaire-client-failure";
import { questionnaireBlockName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { crmQuestionnaireBlockPathFor } from "@/lib/auth/routes";
import { QuestionnaireBlockEditor } from "../../editor/questionnaire-block-editor/questionnaire-block-editor";
import { QuestionnaireMissingLocaleBadge } from "../../editor/questionnaire-missing-locale-badge/questionnaire-missing-locale-badge";
import { QuestionnaireCatalogStatusBadge } from "../questionnaire-catalog-status-badge/questionnaire-catalog-status-badge";
import styles from "./questionnaire-catalog-block-page.module.css";

export type QuestionnaireCatalogBlockPageProps = {
  backHref: string;
  block: QuestionnaireBlockDto;
  canWrite: boolean;
  content: CrmQuestionnaireDictionary;
  fixedChoiceLabels: QuestionnaireFixedChoiceLabels;
  locale: Locale;
  templateCount: number;
};

const KEY = new RegExp(QUESTIONNAIRE_KEY_PATTERN_SOURCE);

/**
 * The catalog around the owner-neutral editor: it injects the catalog writes and adds what only
 * the catalog has, duplicating and deleting. It holds the latest block, so both use its version.
 */
export function QuestionnaireCatalogBlockPage({
  backHref,
  block: initialBlock,
  canWrite,
  content,
  fixedChoiceLabels,
  locale,
  templateCount,
}: QuestionnaireCatalogBlockPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formId = useId();
  const keyRef = useRef<HTMLInputElement>(null);
  const [block, setBlock] = useState(initialBlock);
  const [copyKey, setCopyKey] = useState(
    `${initialBlock.key}_copy`.slice(0, QUESTIONNAIRE_LIMITS.keyMaxLength),
  );
  const [keyError, setKeyError] =
    useState<QuestionnaireFormValidationCode | null>(null);
  const [failure, setFailure] = useState<QuestionnaireErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const text = content.blockPage;
  const requested = searchParams.get(QuestionnaireEditorQueryParam.Dialog);
  const dialog = canWrite
    ? QUESTIONNAIRE_BLOCK_PAGE_DIALOG_VALUES.find(
        (value) => value === requested,
      )
    : undefined;
  const canDelete = templateCount === 0;
  const name = questionnaireBlockName(block, locale);

  function setDialog(next: QuestionnaireBlockPageDialog | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(QuestionnaireEditorQueryParam.Dialog, next);
    else params.delete(QuestionnaireEditorQueryParam.Dialog);
    setFailure(null);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  async function duplicate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const code = !copyKey
      ? QuestionnaireFormValidationCode.Required
      : KEY.test(copyKey)
        ? null
        : QuestionnaireFormValidationCode.Key;
    setKeyError(code);
    if (code) {
      keyRef.current?.focus();
      return;
    }
    setBusy(true);
    const result = await questionnaireCatalogApiService.duplicateBlock(
      block.id,
      {
        key: copyKey,
      },
    );
    if (result.ok) {
      router.push(crmQuestionnaireBlockPathFor(locale, result.value.id));
      return;
    }
    setBusy(false);
    setFailure(questionnaireFailureCode(result));
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    const result = await questionnaireCatalogApiService.deleteBlock(block.id, {
      version: block.version,
    });
    if (result.ok) {
      router.push(backHref);
      router.refresh();
      return;
    }
    setBusy(false);
    if ("current" in result) {
      setBlock(result.current);
      setFailure(null);
      return;
    }
    setFailure(result.code);
  }

  return (
    <div className={styles.page}>
      <Link className={styles.back} href={backHref}>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
        {text.back}
      </Link>
      <header className={styles.header}>
        <div className={styles.intro}>
          <h1 className={styles.title}>{name}</h1>
          <p className={styles.meta}>
            <span>
              {text.keyLabel}: <span className={styles.key}>{block.key}</span>
            </span>
            <span>
              {templateCount === 0
                ? text.usageNone
                : templateCount === 1
                  ? text.usageOne
                  : formatMessage(text.usage, { count: templateCount })}
            </span>
          </p>
          <div className={styles.badges}>
            <QuestionnaireCatalogStatusBadge
              label={content.catalog.status[block.status]}
              status={block.status}
            />
            <QuestionnaireMissingLocaleBadge
              interfaceLocale={locale}
              missing={missingQuestionnaireLocales(block)}
              template={content.editor.locales.missingBadge}
            />
          </div>
        </div>
        {canWrite ? (
          <div className={styles.actions}>
            <ButtonControl
              className={styles.action}
              onClick={() => setDialog(QuestionnaireBlockPageDialog.Duplicate)}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faClone} />
              {text.duplicate}
            </ButtonControl>
            {canDelete ? (
              <ButtonControl
                className={styles.action}
                onClick={() => setDialog(QuestionnaireBlockPageDialog.Delete)}
                type="button"
                variant="ghost"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faTrashCan} />
                {text.delete}
              </ButtonControl>
            ) : (
              <p className={styles.blockedHint}>{text.deleteBlockedHint}</p>
            )}
          </div>
        ) : null}
      </header>

      <QuestionnaireBlockEditor
        api={questionnaireCatalogApiService.definitionApi}
        block={block}
        canWrite={canWrite}
        content={content}
        fixedChoiceLabels={fixedChoiceLabels}
        locale={locale}
        onBlockChangeAction={setBlock}
        showStatus
      />

      {dialog === QuestionnaireBlockPageDialog.Duplicate ? (
        <FormDialog
          busy={busy}
          cancelLabel={content.catalog.dialog.cancel}
          closeLabel={content.catalog.dialog.close}
          description={text.duplicateDialog.description}
          formId={formId}
          initialFocusRef={keyRef}
          onCloseAction={() => setDialog(null)}
          submitLabel={text.duplicateDialog.submit}
          submittingLabel={text.duplicateDialog.submitting}
          title={text.duplicateDialog.title}
        >
          <form
            className={styles.dialogForm}
            id={formId}
            noValidate
            onSubmit={duplicate}
          >
            {failure ? (
              <p className={styles.failure} role="alert">
                {content.errors[failure]}
              </p>
            ) : null}
            <FormField
              errorMessage={
                keyError ? content.catalog.validation[keyError] : undefined
              }
              hint={content.catalog.createBlockDialog.hints.key}
              inputProps={{
                autoCapitalize: "off",
                maxLength: QUESTIONNAIRE_LIMITS.keyMaxLength,
                name: "questionnaire-block-copy-key",
                onChange: (event) => setCopyKey(event.target.value),
                spellCheck: false,
                value: copyKey,
              }}
              inputRef={keyRef}
              kind={FormFieldKind.Text}
              label={text.duplicateDialog.key}
              required
            />
          </form>
        </FormDialog>
      ) : null}

      {dialog === QuestionnaireBlockPageDialog.Delete && canDelete ? (
        <ConfirmDialog
          busy={busy}
          cancelLabel={text.deleteDialog.cancel}
          closeLabel={content.catalog.dialog.close}
          confirmLabel={text.deleteDialog.confirm}
          description={formatMessage(text.deleteDialog.description, { name })}
          onCancelAction={() => setDialog(null)}
          onConfirmAction={() => void remove()}
          title={text.deleteDialog.title}
          tone="danger"
        >
          {failure ? (
            <p className={styles.failure} role="alert">
              {content.errors[failure]}
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
