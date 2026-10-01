import Link from "next/link";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { QuestionnaireTemplateSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-summary.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { DataTableCell, DataTableHeaderCell, DataTableRow } from "@invessiv/ui";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireCatalogStatusBadge } from "../questionnaire-catalog-status-badge/questionnaire-catalog-status-badge";
import styles from "./questionnaire-template-row.module.css";

export type QuestionnaireTemplateRowProps = {
  content: CrmQuestionnaireDictionary;
  href: string;
  locale: Locale;
  template: QuestionnaireTemplateSummaryDto;
};

export function QuestionnaireTemplateRow({
  content,
  href,
  locale,
  template,
}: QuestionnaireTemplateRowProps) {
  const list = content.catalog.templates;
  const editLabel = formatMessage(list.open, { name: template.title });
  const updatedAt = new Date(template.updatedAt);

  return (
    <DataTableRow mobileCard>
      <DataTableHeaderCell mobileCardSlot="primary" scope="row">
        <div className={styles.titleCell}>
          <Link className={styles.titleLink} href={href}>
            {template.title}
          </Link>
          {template.description ? (
            <span className={styles.key}>{template.description}</span>
          ) : null}
        </div>
      </DataTableHeaderCell>
      <DataTableCell className={styles.number} mobileCardSlot="secondary">
        {template.blockCount === 1
          ? list.blockCountOne
          : formatMessage(list.blockCount, { count: template.blockCount })}
      </DataTableCell>
      <DataTableCell mobileCardSlot="detail">
        <time dateTime={template.updatedAt}>
          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            updatedAt,
          )}
        </time>
      </DataTableCell>
      <DataTableCell mobileCardSlot="detail">
        <QuestionnaireCatalogStatusBadge
          label={content.catalog.status[template.status]}
          status={template.status}
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
