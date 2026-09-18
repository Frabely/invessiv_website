import Link from "next/link";

import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";
import {
  ButtonLink,
  DataTableCell,
  DataTableHeaderCell,
  DataTableRow,
} from "@invessiv/ui";
import { buildServiceTemplateEditHref } from "@/common/patterns/crm/service-template-dialog-query";
import type { Locale } from "@/config/i18n";
import type { CrmServicesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceTemplateStatusBadge } from "../service-template-status-badge/service-template-status-badge";
import styles from "./service-template-row.module.css";

type ServiceTemplateRowProps = {
  basePath: string;
  canWrite: boolean;
  content: CrmServicesDictionary;
  includeArchived: boolean;
  locale: Locale;
  serviceTemplate: ServiceTemplateDto;
};

function formatPrice(
  serviceTemplate: ServiceTemplateDto,
  locale: Locale,
  content: CrmServicesDictionary,
): string {
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(serviceTemplate.priceCents / 100);

  if (serviceTemplate.pricingMode === ServicePricingMode.Rate) {
    return `${amount} / ${content.list.pricingMode.rate}`;
  }
  if (
    serviceTemplate.pricingMode === ServicePricingMode.Recurring &&
    serviceTemplate.recurringInterval
  ) {
    return `${amount} / ${content.list.interval[serviceTemplate.recurringInterval]}`;
  }
  return amount;
}

export function ServiceTemplateRow({
  basePath,
  canWrite,
  content,
  includeArchived,
  locale,
  serviceTemplate,
}: ServiceTemplateRowProps) {
  return (
    <DataTableRow mobileCard>
      <DataTableHeaderCell className={styles.titleCell} scope="row">
        {serviceTemplate.title}
      </DataTableHeaderCell>
      <DataTableCell>
        {formatPrice(serviceTemplate, locale, content)}
      </DataTableCell>
      <DataTableCell>
        {content.list.pricingMode[serviceTemplate.pricingMode]}
      </DataTableCell>
      <DataTableCell>
        <ServiceTemplateStatusBadge
          label={content.list.status[serviceTemplate.status]}
          status={serviceTemplate.status}
        />
      </DataTableCell>
      <DataTableCell className={styles.actionsCell}>
        {canWrite ? (
          <ButtonLink
            href={buildServiceTemplateEditHref(
              basePath,
              serviceTemplate.id,
              includeArchived,
            )}
            linkComponent={Link}
            linkComponentProps={{ scroll: false }}
            variant="ghost"
          >
            {content.list.edit}
          </ButtonLink>
        ) : null}
      </DataTableCell>
    </DataTableRow>
  );
}
