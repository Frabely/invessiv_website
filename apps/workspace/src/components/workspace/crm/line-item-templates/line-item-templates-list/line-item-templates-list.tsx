import Link from "next/link";
import { faLayerGroup, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import { DataTableLayout, EmptyState, PrimaryCtaLink } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { LineItemTemplateRow } from "../line-item-template-row/line-item-template-row";
import styles from "./line-item-templates-list.module.css";

type LineItemTemplatesListProps = {
  basePath: string;
  canWrite: boolean;
  content: CrmLineItemTemplatesDictionary;
  createHref: string | null;
  hasLineItemTemplates: boolean;
  includeArchived: boolean;
  locale: Locale;
  lineItemTemplates: LineItemTemplateDto[];
  toggleArchivedHref: string;
};

export function LineItemTemplatesList({
  basePath,
  canWrite,
  content,
  createHref,
  hasLineItemTemplates,
  includeArchived,
  locale,
  lineItemTemplates,
  toggleArchivedHref,
}: LineItemTemplatesListProps) {
  if (lineItemTemplates.length === 0) {
    if (hasLineItemTemplates) {
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
    <section className={styles.shell}>
      <DataTableLayout
        ariaLabel={content.list.caption}
        caption={content.list.caption}
        columns={columns}
        frameClassName={styles.tableFrame}
      >
        {lineItemTemplates.map((lineItemTemplate) => (
          <LineItemTemplateRow
            basePath={basePath}
            canWrite={canWrite}
            content={content}
            includeArchived={includeArchived}
            key={lineItemTemplate.id}
            locale={locale}
            lineItemTemplate={lineItemTemplate}
          />
        ))}
      </DataTableLayout>
    </section>
  );
}
