import Link from "next/link";
import { faClipboardList, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { QuestionnaireTemplateListDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-list.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { DataTableLayout, EmptyState, PrimaryCtaLink } from "@invessiv/ui";
import { WorkspaceScrollableTableArea } from "@/components/workspace/shared/workspace-scrollable-table-area/workspace-scrollable-table-area";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireTemplateRow } from "../questionnaire-template-row/questionnaire-template-row";

export type QuestionnaireTemplateListProps = {
  content: CrmQuestionnaireDictionary;
  /** Null without `questionnaire_templates.write`. */
  createHref: string | null;
  list: QuestionnaireTemplateListDto;
  locale: Locale;
  resetHref: string;
  templateHref: (templateId: string) => string;
};

export function QuestionnaireTemplateList({
  content,
  createHref,
  list,
  locale,
  resetHref,
  templateHref,
}: QuestionnaireTemplateListProps) {
  const text = content.catalog.templates;

  if (list.rows.length === 0) {
    if (list.hasTemplates)
      return (
        <EmptyState
          action={
            <PrimaryCtaLink
              href={resetHref}
              linkComponent={Link}
              linkComponentProps={{ scroll: false }}
            >
              {text.noResults.action}
            </PrimaryCtaLink>
          }
          description={text.noResults.description}
          icon={<FontAwesomeIcon icon={faClipboardList} />}
          title={text.noResults.title}
          variant="filtered"
        />
      );
    return (
      <EmptyState
        action={
          createHref ? (
            <PrimaryCtaLink
              href={createHref}
              linkComponent={Link}
              linkComponentProps={{ scroll: false }}
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
              {text.empty.action}
            </PrimaryCtaLink>
          ) : undefined
        }
        description={text.empty.description}
        icon={<FontAwesomeIcon icon={faClipboardList} />}
        title={text.empty.title}
      />
    );
  }

  return (
    <WorkspaceScrollableTableArea>
      <DataTableLayout
        ariaLabel={text.caption}
        caption={text.caption}
        columns={[
          { header: text.columns.title, id: "title" },
          { header: text.columns.blocks, id: "blocks", width: 140 },
          { header: text.columns.updated, id: "updated", width: 150 },
          { header: text.columns.status, id: "status", width: 140 },
          {
            header: text.columns.actions,
            id: "actions",
            isPinned: true,
            isVisuallyHidden: true,
            width: 72,
          },
        ]}
        fillAvailableHeight
      >
        {list.rows.map((template) => (
          <QuestionnaireTemplateRow
            content={content}
            href={templateHref(template.id)}
            key={template.id}
            locale={locale}
            template={template}
          />
        ))}
      </DataTableLayout>
    </WorkspaceScrollableTableArea>
  );
}
