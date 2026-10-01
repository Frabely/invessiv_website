import Link from "next/link";
import { faLayerGroup, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { QuestionnaireBlockListDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-list.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { DataTableLayout, EmptyState, PrimaryCtaLink } from "@invessiv/ui";
import { WorkspaceScrollableTableArea } from "@/components/workspace/shared/workspace-scrollable-table-area/workspace-scrollable-table-area";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireBlockRow } from "../questionnaire-block-row/questionnaire-block-row";

export type QuestionnaireBlockListProps = {
  blockHref: (blockId: string) => string;
  content: CrmQuestionnaireDictionary;
  /** Null without `questionnaire_templates.write`. */
  createHref: string | null;
  list: QuestionnaireBlockListDto;
  locale: Locale;
  resetHref: string;
};

/** "Nothing yet" invites to create; "no match" offers to reset the filters. */
export function QuestionnaireBlockList({
  blockHref,
  content,
  createHref,
  list,
  locale,
  resetHref,
}: QuestionnaireBlockListProps) {
  const text = content.catalog.blocks;

  if (list.rows.length === 0) {
    if (list.hasBlocks)
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
          icon={<FontAwesomeIcon icon={faLayerGroup} />}
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
        icon={<FontAwesomeIcon icon={faLayerGroup} />}
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
          { header: text.columns.fields, id: "fields", width: 120 },
          { header: text.columns.usage, id: "usage", width: 120 },
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
        {list.rows.map((block) => (
          <QuestionnaireBlockRow
            block={block}
            content={content}
            href={blockHref(block.id)}
            key={block.id}
            locale={locale}
          />
        ))}
      </DataTableLayout>
    </WorkspaceScrollableTableArea>
  );
}
