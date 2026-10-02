"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useId, useState } from "react";
import { faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  QUESTIONNAIRE_CATALOG_STATUS_VALUES,
  QuestionnaireCatalogStatus,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { sameSequence } from "@invessiv/common/patterns/collections/same-sequence";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  CustomSelect,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { questionnaireCatalogApiService } from "@/client/crm/questionnaire-catalog-api-service";
import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import { QuestionnaireSaveOutcomeKind } from "@/common/constants/crm/questionnaire/questionnaire-save-outcome-kinds";
import type { QuestionnaireSaveOutcome } from "@/common/contracts/crm/questionnaire/questionnaire-save-outcome";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import { useVersionedCommand } from "@/hooks/workspace/use-versioned-command";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { crmQuestionnaireBlockPathFor } from "@/lib/auth/routes";
import { QuestionnaireCatalogStatusBadge } from "../../catalog/questionnaire-catalog-status-badge/questionnaire-catalog-status-badge";
import { QuestionnaireBlockPickerDialog } from "../../block-list/questionnaire-block-picker-dialog/questionnaire-block-picker-dialog";
import { OrderedBlockListEditor } from "../../block-list/ordered-block-list-editor/ordered-block-list-editor";
import styles from "./questionnaire-template-editor.module.css";

export type QuestionnaireTemplateEditorProps = {
  backHref: string;
  /** Every catalog block, archived ones too: a template may still hold an archived block. */
  blocks: QuestionnaireBlockSummaryDto[];
  canWrite: boolean;
  content: CrmQuestionnaireDictionary;
  locale: Locale;
  template: QuestionnaireTemplateDto;
};

type Draft = {
  title: string;
  description: string;
  status: QuestionnaireCatalogStatus;
  blockIds: string[];
};

function draftOf(template: QuestionnaireTemplateDto): Draft {
  return {
    title: template.title,
    description: template.description ?? "",
    status: template.status,
    blockIds: template.blocks.map((block) => block.blockId),
  };
}

function sameDraft(left: Draft, right: Draft): boolean {
  return (
    left.title === right.title &&
    left.description === right.description &&
    left.status === right.status &&
    sameSequence(left.blockIds, right.blockIds)
  );
}

/**
 * Head and block order are edited locally and saved in one versioned write. The picker is part of
 * that unsaved draft, so its open state stays in React instead of the URL.
 */
export function QuestionnaireTemplateEditor({
  backHref,
  blocks,
  canWrite,
  content,
  locale,
  template: initialTemplate,
}: QuestionnaireTemplateEditorProps) {
  const router = useRouter();
  const formId = useId();
  const statusId = useId();
  const [template, setTemplate] = useState(initialTemplate);
  const [draft, setDraft] = useState<Draft>(() => draftOf(initialTemplate));
  const [titleError, setTitleError] =
    useState<QuestionnaireFormValidationCode | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { busy, run } = useVersionedCommand();
  const [outcome, setOutcome] = useState<QuestionnaireSaveOutcome>(null);
  const text = content.templateEditor;
  const byId = new Map(blocks.map((block) => [block.id, block]));
  const dirty = !sameDraft(draft, draftOf(template));

  function change(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setOutcome(null);
  }

  function titleOf(block: QuestionnaireBlockSummaryDto): string {
    return resolveQuestionnaireText(block.titles, locale)?.text ?? block.key;
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!draft.title.trim()) {
      setTitleError(QuestionnaireFormValidationCode.Required);
      return;
    }
    setTitleError(null);
    setOutcome(null);
    const result = await run(() =>
      questionnaireCatalogApiService.updateTemplate(template.id, {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        status: draft.status,
        blockIds: draft.blockIds,
        version: template.version,
      }),
    );
    switch (result.kind) {
      case VersionedMutationOutcomeKind.Saved:
        setTemplate(result.value);
        setDraft(draftOf(result.value));
        setOutcome({ kind: QuestionnaireSaveOutcomeKind.Saved });
        router.refresh();
        return;
      case VersionedMutationOutcomeKind.Conflict:
        setTemplate(result.current);
        setOutcome({ kind: QuestionnaireSaveOutcomeKind.Conflict });
        return;
      case VersionedMutationOutcomeKind.Failure:
        setOutcome({
          kind: QuestionnaireSaveOutcomeKind.Failure,
          code: result.code,
        });
    }
  }

  const blockCount = draft.blockIds.length;

  return (
    <div className={styles.page}>
      <Link className={styles.back} href={backHref}>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
        {content.templatePage.back}
      </Link>
      <form className={styles.editor} id={formId} noValidate onSubmit={save}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {draft.title.trim() || template.title}
          </h1>
          <QuestionnaireCatalogStatusBadge
            label={content.catalog.status[template.status]}
            status={template.status}
          />
        </header>

        <fieldset className={styles.head} disabled={!canWrite}>
          <legend className="sr-only">{text.head.legend}</legend>
          <div className={styles.headRow}>
            <FormField
              errorMessage={
                titleError ? content.catalog.validation[titleError] : undefined
              }
              inputProps={{
                maxLength: QUESTIONNAIRE_LIMITS.titleMaxLength,
                name: "questionnaire-template-title",
                onChange: (event) => change({ title: event.target.value }),
                readOnly: !canWrite,
                value: draft.title,
              }}
              kind={FormFieldKind.Text}
              label={text.head.title}
              required
            />
            <FormField
              controlId={statusId}
              kind={FormFieldKind.Custom}
              label={text.head.status}
              renderControl={({ describedBy, id }) => (
                <CustomSelect
                  describedBy={describedBy}
                  disabled={!canWrite}
                  id={id}
                  onChange={(status) => change({ status })}
                  options={QUESTIONNAIRE_CATALOG_STATUS_VALUES.map((value) => ({
                    label: content.catalog.status[value],
                    value,
                  }))}
                  value={draft.status}
                />
              )}
            />
          </div>
          <FormField
            hint={text.head.descriptionHint}
            kind={FormFieldKind.Textarea}
            label={text.head.description}
            textareaProps={{
              maxLength: QUESTIONNAIRE_LIMITS.templateDescriptionMaxLength,
              name: "questionnaire-template-description",
              onChange: (event) => change({ description: event.target.value }),
              readOnly: !canWrite,
              rows: 2,
              value: draft.description,
            }}
          />
        </fieldset>

        <section aria-labelledby={`${formId}-blocks`} className={styles.blocks}>
          <header className={styles.blocksHeader}>
            <h2 className={styles.blocksTitle} id={`${formId}-blocks`}>
              {text.blocks.legend}
              <span className={styles.count}>
                {blockCount === 1
                  ? text.blocks.countOne
                  : formatMessage(text.blocks.count, { count: blockCount })}
              </span>
            </h2>
            {canWrite ? (
              <ButtonControl
                className={styles.addButton}
                disabled={
                  busy || blockCount >= QUESTIONNAIRE_LIMITS.blocksPerOwner
                }
                onClick={() => setPickerOpen(true)}
                type="button"
                variant="ghost"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
                {text.blocks.add}
              </ButtonControl>
            ) : null}
          </header>
          <OrderedBlockListEditor
            disabled={!canWrite || busy}
            empty={<p className={styles.empty}>{text.blocks.empty}</p>}
            items={draft.blockIds.map((id) => {
              const block = byId.get(id);
              return {
                id,
                name: block ? titleOf(block) : id,
                detail: (
                  <>
                    <span>{block?.key}</span>
                    {block?.status === QuestionnaireCatalogStatus.Archived ? (
                      <span
                        className={styles.archived}
                        title={text.blocks.archivedHint}
                      >
                        {text.blocks.archived}
                      </span>
                    ) : null}
                    <Link
                      className={styles.open}
                      href={crmQuestionnaireBlockPathFor(locale, id)}
                    >
                      {text.blocks.open}
                    </Link>
                  </>
                ),
              };
            })}
            labels={text.blocks}
            onAnnounceAction={setAnnouncement}
            onChangeAction={(blockIds) => change({ blockIds })}
          />
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </section>

        {canWrite ? (
          <footer className={styles.footer}>
            <p
              aria-live="polite"
              className={styles.outcome}
              data-kind={outcome?.kind}
            >
              {outcome?.kind === QuestionnaireSaveOutcomeKind.Saved
                ? text.saved
                : null}
              {outcome?.kind === QuestionnaireSaveOutcomeKind.Conflict
                ? text.conflict
                : null}
              {outcome?.kind === QuestionnaireSaveOutcomeKind.Failure
                ? content.errors[outcome.code]
                : null}
              {!outcome && dirty ? text.unsaved : null}
            </p>
            {dirty ? (
              <ButtonControl
                disabled={busy}
                onClick={() => {
                  setDraft(draftOf(template));
                  setOutcome(null);
                }}
                type="button"
                variant="ghost"
              >
                {text.reset}
              </ButtonControl>
            ) : null}
            <PrimaryCtaButton disabled={busy || !dirty} type="submit">
              {busy ? text.saving : text.save}
            </PrimaryCtaButton>
          </footer>
        ) : null}
      </form>

      {pickerOpen ? (
        <QuestionnaireBlockPickerDialog
          blocks={blocks}
          chosenIds={draft.blockIds}
          content={text.picker}
          locale={locale}
          onAddAction={(block) => {
            change({ blockIds: [...draft.blockIds, block.id] });
            setAnnouncement(
              formatMessage(text.blocks.added, {
                name: titleOf(block),
                position: draft.blockIds.length + 1,
              }),
            );
          }}
          onCloseAction={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
