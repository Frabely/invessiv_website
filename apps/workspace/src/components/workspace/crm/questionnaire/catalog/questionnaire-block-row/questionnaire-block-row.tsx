import Link from "next/link";
import { faBuilding, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { DataTableCell, DataTableHeaderCell, DataTableRow } from "@invessiv/ui";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireMissingLocaleBadge } from "../../editor/questionnaire-missing-locale-badge/questionnaire-missing-locale-badge";
import { QuestionnaireCatalogStatusBadge } from "../questionnaire-catalog-status-badge/questionnaire-catalog-status-badge";
import styles from "./questionnaire-block-row.module.css";

export type QuestionnaireBlockRowProps = {
  block: QuestionnaireBlockSummaryDto;
  content: CrmQuestionnaireDictionary;
  href: string;
  locale: Locale;
};

export function QuestionnaireBlockRow({
  block,
  content,
  href,
  locale,
}: QuestionnaireBlockRowProps) {
  const list = content.catalog.blocks;
  const title =
    resolveQuestionnaireText(block.titles, locale)?.text ?? block.key;
  const editLabel = formatMessage(list.open, { name: title });

  return (
    <DataTableRow mobileCard>
      <DataTableHeaderCell mobileCardSlot="primary" scope="row">
        <div className={styles.titleCell}>
          <Link className={styles.titleLink} href={href}>
            {title}
          </Link>
          <span className={styles.key}>{block.key}</span>
          <span className={styles.badges}>
            {block.carryOver ? (
              <span className={styles.carryOver} title={list.carryOverHint}>
                <FontAwesomeIcon aria-hidden="true" icon={faBuilding} />
                {list.carryOver}
              </span>
            ) : null}
            <QuestionnaireMissingLocaleBadge
              interfaceLocale={locale}
              missing={block.missingLocales}
              template={content.editor.locales.missingBadge}
            />
          </span>
        </div>
      </DataTableHeaderCell>
      <DataTableCell className={styles.number} mobileCardSlot="secondary">
        {block.fieldCount === 1
          ? list.fieldCountOne
          : formatMessage(list.fieldCount, { count: block.fieldCount })}
      </DataTableCell>
      <DataTableCell className={styles.number} mobileCardSlot="detail">
        {formatMessage(list.usage, { count: block.templateCount })}
      </DataTableCell>
      <DataTableCell mobileCardSlot="detail">
        <QuestionnaireCatalogStatusBadge
          label={content.catalog.status[block.status]}
          status={block.status}
        />
      </DataTableCell>
      <DataTableCell mobileCardSlot="actions">
        <Link
          aria-label={editLabel}
          className={styles.action}
          href={href}
          title={editLabel}
        >
          <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
        </Link>
      </DataTableCell>
    </DataTableRow>
  );
}
