"use client";

import { useId, useRef, useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  onAddAction: (block: QuestionnaireBlockSummaryDto) => void;
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
  onAddAction,
  onCloseAction,
}: QuestionnaireBlockPickerDialogProps) {
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
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

  return (
    <Dialog
      closeLabel={content.close}
      description={content.description}
      footer={
        <PrimaryCtaButton onClick={onCloseAction} type="button">
          {content.close}
        </PrimaryCtaButton>
      }
      initialFocusRef={searchRef}
      onCloseAction={onCloseAction}
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
          onChange={(event) => setSearch(event.target.value)}
          placeholder={content.searchPlaceholder}
          ref={searchRef}
          type="search"
          value={search}
        />
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
                  <ButtonControl
                    aria-label={formatMessage(content.addNamed, {
                      name: title,
                    })}
                    className={styles.add}
                    onClick={() => onAddAction(block)}
                    type="button"
                    variant="ghost"
                  >
                    <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
                    {content.add}
                  </ButtonControl>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
