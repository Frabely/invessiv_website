import Link from "next/link";
import { faLayerGroup, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";
import { DataTableLayout, EmptyState, PrimaryCtaLink } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmServicesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceTemplateRow } from "../service-template-row/service-template-row";

type ServiceTemplatesListProps = {
  basePath: string;
  canWrite: boolean;
  content: CrmServicesDictionary;
  createHref: string | null;
  hasServiceTemplates: boolean;
  includeArchived: boolean;
  locale: Locale;
  serviceTemplates: ServiceTemplateDto[];
  toggleArchivedHref: string;
};

export function ServiceTemplatesList({
  basePath,
  canWrite,
  content,
  createHref,
  hasServiceTemplates,
  includeArchived,
  locale,
  serviceTemplates,
  toggleArchivedHref,
}: ServiceTemplatesListProps) {
  if (serviceTemplates.length === 0) {
    if (hasServiceTemplates) {
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
    <DataTableLayout
      ariaLabel={content.list.caption}
      caption={content.list.caption}
      columns={columns}
    >
      {serviceTemplates.map((serviceTemplate) => (
        <ServiceTemplateRow
          basePath={basePath}
          canWrite={canWrite}
          content={content}
          includeArchived={includeArchived}
          key={serviceTemplate.id}
          locale={locale}
          serviceTemplate={serviceTemplate}
        />
      ))}
    </DataTableLayout>
  );
}
