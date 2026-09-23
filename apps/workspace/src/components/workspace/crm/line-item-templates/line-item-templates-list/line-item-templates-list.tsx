import Link from "next/link";
import { faLayerGroup, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { ListLineItemTemplatesResult } from "@invessiv/common/contracts/crm/results/list-line-item-templates-result";
import {
  DataTableLayout,
  EmptyState,
  type ListPaginationProps,
  PrimaryCtaLink,
} from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { WorkspaceScrollableTableArea } from "@/components/workspace/shared/workspace-scrollable-table-area/workspace-scrollable-table-area";
import { LineItemTemplateRow } from "../line-item-template-row/line-item-template-row";

type LineItemTemplatesListProps = {
  basePath: string;
  canWrite: boolean;
  content: CrmLineItemTemplatesDictionary;
  createHref: string | null;
  list: ListLineItemTemplatesResult;
  locale: Locale;
  queryString: string;
  toggleArchivedHref: string;
};

export function LineItemTemplatesList({
  basePath,
  canWrite,
  content,
  createHref,
  list,
  locale,
  queryString,
  toggleArchivedHref,
}: LineItemTemplatesListProps) {
  const lineItemTemplates = list.rows;
  if (lineItemTemplates.length === 0) {
    if (list.hasLineItemTemplates) {
      return (
        <EmptyState
          action={
            <PrimaryCtaLink
              href={toggleArchivedHref}
              linkComponent={Link}
              linkComponentProps={{ scroll: false }}
            >
              {content.list.noResults.action}
            </PrimaryCtaLink>
          }
          description={content.list.noResults.description}
          icon={<FontAwesomeIcon icon={faLayerGroup} />}
          title={content.list.noResults.title}
          variant="filtered"
        />
      );
    }

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
              {content.list.empty.action}
            </PrimaryCtaLink>
          ) : undefined
        }
        description={content.list.empty.description}
        icon={<FontAwesomeIcon icon={faLayerGroup} />}
        title={content.list.empty.title}
      />
    );
  }

  const pagination: ListPaginationProps = {
    basePath,
    content: content.list.pagination,
    currentPage: list.page,
    perPage: list.perPage,
    queryString,
    total: list.total,
  };
  const columns = [
    { header: content.list.columns.title, id: "title" },
    { header: content.list.columns.price, id: "price", width: 160 },
    { header: content.list.columns.pricingMode, id: "pricingMode", width: 160 },
    { header: content.list.columns.status, id: "status", width: 140 },
    {
      header: content.list.columns.actions,
      id: "actions",
      isPinned: true,
      isVisuallyHidden: true,
      width: 100,
    },
  ];

  return (
    <WorkspaceScrollableTableArea>
      <DataTableLayout
        ariaLabel={content.list.caption}
        caption={content.list.caption}
        columns={columns}
        fillAvailableHeight
        pagination={pagination}
      >
        {lineItemTemplates.map((lineItemTemplate) => (
          <LineItemTemplateRow
            basePath={basePath}
            canWrite={canWrite}
            content={content}
            key={lineItemTemplate.id}
            locale={locale}
            lineItemTemplate={lineItemTemplate}
            queryString={queryString}
          />
        ))}
      </DataTableLayout>
    </WorkspaceScrollableTableArea>
  );
}
