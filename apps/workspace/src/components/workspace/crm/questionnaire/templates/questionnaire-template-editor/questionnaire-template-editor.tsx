"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type SubmitEvent, useEffect, useId, useRef, useState } from "react";
import { faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  QUESTIONNAIRE_CATALOG_STATUS_VALUES,
  QuestionnaireCatalogStatus,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { sameSequence } from "@invessiv/common/patterns/collections/same-sequence";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { resolveQuestionnaireBlock } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-resolved-block";
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
import { QuestionnaireEditorQueryParam } from "@/common/constants/crm/questionnaire/questionnaire-editor-query-params";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import { writeQuestionnaireEditorDialog } from "@/common/patterns/crm/questionnaire/questionnaire-editor-query";
import { useVersionedCommand } from "@/hooks/workspace/use-versioned-command";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireCatalogStatusBadge } from "../../catalog/questionnaire-catalog-status-badge/questionnaire-catalog-status-badge";
import { QuestionnaireBlockPickerDialog } from "../../block-list/questionnaire-block-picker-dialog/questionnaire-block-picker-dialog";
import { OrderedBlockListEditor } from "../../block-list/ordered-block-list-editor/ordered-block-list-editor";
import { QuestionnaireTemplateBlockDialog } from "../questionnaire-template-block-dialog/questionnaire-template-block-dialog";
import { QuestionnaireTemplatePreview } from "../questionnaire-template-preview/questionnaire-template-preview";
import styles from "./questionnaire-template-editor.module.css";

export type QuestionnaireTemplateEditorProps = {
  backHref: string;
  /** Every catalog block, archived ones too: a template may still hold an archived block. */
  blocks: QuestionnaireBlockSummaryDto[];
  initialBlocks: QuestionnaireBlockDto[];
  fixedChoiceLabels: QuestionnaireFixedChoiceLabels;
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
  initialBlocks,
  fixedChoiceLabels,
  canWrite,
  content,
  locale,
  template: initialTemplate,
}: QuestionnaireTemplateEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openLinkRef = useRef<HTMLAnchorElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const pendingPreviewIdRef = useRef<string | null>(null);
  const formId = useId();
  const statusId = useId();
  const [template, setTemplate] = useState(initialTemplate);
  const [fullBlocks, setFullBlocks] = useState<
    Record<string, QuestionnaireBlockDto>
  >(() => Object.fromEntries(initialBlocks.map((block) => [block.id, block])));
  const [catalogBlocks, setCatalogBlocks] = useState(blocks);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft>(() => draftOf(initialTemplate));
  const [titleError, setTitleError] =
    useState<QuestionnaireFormValidationCode | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { busy, run } = useVersionedCommand();
  const [outcome, setOutcome] = useState<QuestionnaireSaveOutcome>(null);
  const text = content.templateEditor;
  const byId = new Map(catalogBlocks.map((block) => [block.id, block]));
  const requestedBlockId = searchParams.get(
    QuestionnaireEditorQueryParam.TemplateBlock,
  );
  const selectedBlock =
    requestedBlockId && draft.blockIds.includes(requestedBlockId)
      ? fullBlocks[requestedBlockId]
      : null;
  const missingIds = draft.blockIds.filter(
    (id) => !fullBlocks[id] && !loadErrors.includes(id),
  );
  const missingKey = missingIds.join(",");
  const previewBlocks = draft.blockIds.flatMap((id) =>
    fullBlocks[id] ? [resolveQuestionnaireBlock(fullBlocks[id], locale)] : [],
  );

  useEffect(() => {
    if (!missingKey) return;
    let active = true;
    void Promise.all(
      missingKey.split(",").map(async (id) => ({
        id,
        block: await questionnaireCatalogApiService.getBlock(id),
      })),
    ).then((results) => {
      if (!active) return;
      setFullBlocks((current) => ({
        ...current,
        ...Object.fromEntries(
          results.flatMap(({ id, block }) => (block ? [[id, block]] : [])),
        ),
      }));
      setLoadErrors((current) => [
        ...current,
        ...results.filter(({ block }) => !block).map(({ id }) => id),
      ]);
    });
    return () => {
      active = false;
    };
  }, [missingKey]);

  function scrollToPreviewBlock(id: string) {
    const container = previewScrollRef.current;
    const target = Array.from(
      container?.querySelectorAll<HTMLElement>("[data-block-id]") ?? [],
    ).find((element) => element.dataset.blockId === id);
    if (!container || !target) {
      pendingPreviewIdRef.current = id;
      return;
    }
    pendingPreviewIdRef.current = null;
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";
    if (window.getComputedStyle(container).overflowY === "auto") {
      const top =
        container.scrollTop +
        target.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        16;
      container.scrollTo({ top: Math.max(0, top), behavior });
    } else {
      target.scrollIntoView({ behavior, block: "start" });
    }
  }

  useEffect(() => {
    if (pendingPreviewIdRef.current) {
      scrollToPreviewBlock(pendingPreviewIdRef.current);
    }
  }, [fullBlocks]);

  function blockHref(id: string | null) {
    const params = writeQuestionnaireEditorDialog(
      new URLSearchParams(searchParams.toString()),
      null,
    );
    if (id) params.set(QuestionnaireEditorQueryParam.TemplateBlock, id);
    else params.delete(QuestionnaireEditorQueryParam.TemplateBlock);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function closeBlock() {
    const trigger = openLinkRef.current;
    router.replace(blockHref(null), { scroll: false });
    requestAnimationFrame(() => trigger?.focus());
  }

  function adoptBlock(block: QuestionnaireBlockDto) {
    setFullBlocks((current) => ({ ...current, [block.id]: block }));
    setCatalogBlocks((current) =>
      current.map((summary) =>
        summary.id === block.id
          ? {
              ...summary,
              key: block.key,
              status: block.status,
              titles: Object.fromEntries(
                Object.entries(block.translations).map(([locale, value]) => [
                  locale,
                  value.title,
                ]),
              ),
            }
          : summary,
      ),
    );
  }
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

        <div className={styles.columns}>
          <section
            aria-labelledby={`${formId}-blocks`}
            className={styles.blocks}
          >
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
                  name: fullBlocks[id]
                    ? resolveQuestionnaireBlock(fullBlocks[id], locale).title
                    : block
                      ? titleOf(block)
                      : id,
                  detail: (
                    <>
                      <span>{fullBlocks[id]?.key ?? block?.key}</span>
                      {(fullBlocks[id]?.status ?? block?.status) ===
                      QuestionnaireCatalogStatus.Archived ? (
                        <span
                          className={styles.archived}
                          title={text.blocks.archivedHint}
                        >
                          {text.blocks.archived}
                        </span>
                      ) : null}
                      <Link
                        className={styles.open}
                        href={blockHref(id)}
                        ref={requestedBlockId === id ? openLinkRef : undefined}
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
              onSelectAction={scrollToPreviewBlock}
            />
            <p aria-live="polite" className="sr-only">
              {announcement}
            </p>
          </section>

          <QuestionnaireTemplatePreview
            blocks={previewBlocks}
            content={content}
            hasLoadError={draft.blockIds.some((id) => loadErrors.includes(id))}
            loading={missingIds.length > 0}
            onRetryAction={() =>
              setLoadErrors((current) =>
                current.filter((id) => !draft.blockIds.includes(id)),
              )
            }
            scrollRef={previewScrollRef}
            titleId={`${formId}-preview`}
          />
        </div>

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

      {selectedBlock ? (
        <QuestionnaireTemplateBlockDialog
          block={selectedBlock}
          canWrite={canWrite}
          content={content}
          fixedChoiceLabels={fixedChoiceLabels}
          locale={locale}
          onBlockChangeAction={adoptBlock}
          onCloseAction={closeBlock}
        />
      ) : null}

      {pickerOpen ? (
        <QuestionnaireBlockPickerDialog
          maxSelection={Math.min(
            QUESTIONNAIRE_LIMITS.catalogBlocksPerAdd,
            QUESTIONNAIRE_LIMITS.blocksPerOwner - blockCount,
          )}
          blocks={catalogBlocks}
          chosenIds={draft.blockIds}
          content={text.picker}
          locale={locale}
          onAddAction={(selectedBlocks) => {
            change({
              blockIds: [
                ...draft.blockIds,
                ...selectedBlocks.map((block) => block.id),
              ],
            });
            setAnnouncement(
              selectedBlocks.length === 1
                ? formatMessage(text.blocks.added, {
                    name: titleOf(selectedBlocks[0]),
                    position: draft.blockIds.length + 1,
                  })
                : formatMessage(text.blocks.addedMany, {
                    count: selectedBlocks.length,
                  }),
            );
            return true;
          }}
          onCloseAction={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
