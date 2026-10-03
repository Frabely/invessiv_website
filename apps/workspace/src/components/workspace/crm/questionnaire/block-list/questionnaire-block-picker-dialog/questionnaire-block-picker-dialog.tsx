"use client";

import { useId, useRef, useState } from "react";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, Dialog, PrimaryCtaButton } from "@invessiv/ui";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./questionnaire-block-picker-dialog.module.css";

export type QuestionnaireBlockPickerDialogProps = {
  blocks: readonly QuestionnaireBlockSummaryDto[];
  chosenIds: readonly string[];
  content: CrmQuestionnaireDictionary["templateEditor"]["picker"];
  locale: Locale;
  busy?: boolean;
  failure?: string | null;
  maxSelection: number;
  onAddAction: (
    blocks: readonly QuestionnaireBlockSummaryDto[],
  ) => boolean | Promise<boolean>;
  onCloseAction: () => void;
};

function titleOf(block: QuestionnaireBlockSummaryDto, locale: Locale): string {
  return resolveQuestionnaireText(block.titles, locale)?.text ?? block.key;
}

/** Stays open for several additions; every added block leaves the list right away. */
export function QuestionnaireBlockPickerDialog({
  blocks,
  chosenIds,
  content,
  locale,
  busy = false,
  failure = null,
  maxSelection,
  onAddAction,
  onCloseAction,
}: QuestionnaireBlockPickerDialogProps) {
  const id = useId();
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const available = blocks.filter(
    (block) =>
      block.status === QuestionnaireCatalogStatus.Active &&
      !chosenIds.includes(block.id),
  );
  const needle = search.trim().toLocaleLowerCase(locale);
  const matches = needle
    ? available.filter(
        (block) =>
          block.key.includes(needle) ||
          titleOf(block, locale).toLocaleLowerCase(locale).includes(needle),
      )
    : available;
  const selectedBlocks = selectedIds.flatMap((selectedId) => {
    const block = available.find((candidate) => candidate.id === selectedId);
    return block ? [block] : [];
  });

  async function addSelected() {
    if (busy || selectedBlocks.length === 0) return;
    if (await onAddAction(selectedBlocks)) setSelectedIds([]);
  }

  return (
    <Dialog
      closeLabel={content.close}
      description={content.description}
      footer={
        <div className={styles.footer}>
          <p className={styles.selectedCount}>
            {formatMessage(content.selectedCount, {
              count: selectedBlocks.length,
            })}
          </p>
          <div className={styles.footerActions}>
            <ButtonControl
              disabled={busy}
              onClick={onCloseAction}
              type="button"
              variant="ghost"
            >
              {content.close}
            </ButtonControl>
            <PrimaryCtaButton
              disabled={busy || selectedBlocks.length === 0}
              onClick={() => void addSelected()}
              type="button"
            >
              {busy ? content.adding : content.addSelected}
            </PrimaryCtaButton>
          </div>
        </div>
      }
      initialFocusRef={searchRef}
      onCloseAction={busy ? () => undefined : onCloseAction}
      size={DialogSize.Narrow}
      title={content.title}
    >
      <div className={styles.body}>
        <label className={styles.searchLabel} htmlFor={searchId}>
          {content.search}
        </label>
        <input
          className={styles.search}
          id={searchId}
          disabled={busy}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={content.searchPlaceholder}
          ref={searchRef}
          type="search"
          value={search}
        />
        {failure ? (
          <p className={styles.failure} role="alert">
            {failure}
          </p>
        ) : null}
        {matches.length === 0 ? (
          <p className={styles.empty}>
            {available.length === 0 ? content.empty : content.noResults}
          </p>
        ) : (
          <ul className={styles.options}>
            {matches.map((block) => {
              const title = titleOf(block, locale);
              return (
                <li className={styles.option} key={block.id}>
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{title}</span>
                    <span className={styles.optionKey}>{block.key}</span>
                  </span>
                  <label
                    className={styles.checkboxLabel}
                    htmlFor={`${id}-${block.id}`}
                    title={formatMessage(content.addNamed, { name: title })}
                  >
                    <input
                      aria-label={formatMessage(content.addNamed, {
                        name: title,
                      })}
                      checked={selectedIds.includes(block.id)}
                      disabled={
                        busy ||
                        (!selectedIds.includes(block.id) &&
                          selectedIds.length >= maxSelection)
                      }
                      id={`${id}-${block.id}`}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, block.id]
                            : current.filter(
                                (selectedId) => selectedId !== block.id,
                              ),
                        )
                      }
                      type="checkbox"
                    />
                    <span>{content.add}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
