import Link from "next/link";

import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import {
  ButtonLink,
  DataTableCell,
  DataTableHeaderCell,
  DataTableRow,
} from "@invessiv/ui";
import { buildLineItemTemplateEditHref } from "@/common/patterns/crm/line-item-template-dialog-query";
import type { Locale } from "@/config/i18n";
import type { CrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { createNumberFormatterCache } from "@/lib/workspace/intl-number-formatter-cache";
import { LineItemTemplateStatusBadge } from "../line-item-template-status-badge/line-item-template-status-badge";
import styles from "./line-item-template-row.module.css";

type LineItemTemplateRowProps = {
  basePath: string;
  canWrite: boolean;
  content: CrmLineItemTemplatesDictionary;
  includeArchived: boolean;
  locale: Locale;
  lineItemTemplate: LineItemTemplateDto;
};

const getCurrencyFormatter = createNumberFormatterCache({
  style: "currency",
  currency: "EUR",
});

function formatPrice(
  lineItemTemplate: LineItemTemplateDto,
  locale: Locale,
  content: CrmLineItemTemplatesDictionary,
): string {
  const amount = getCurrencyFormatter(locale).format(
    lineItemTemplate.priceCents / 100,
  );

  if (lineItemTemplate.pricingMode === ServicePricingMode.Rate) {
    return `${amount} / ${content.list.pricingMode.rate}`;
  }
  if (
    lineItemTemplate.pricingMode === ServicePricingMode.Recurring &&
    lineItemTemplate.recurringInterval
  ) {
    return `${amount} / ${content.list.interval[lineItemTemplate.recurringInterval]}`;
  }
  return amount;
}

export function LineItemTemplateRow({
  basePath,
  canWrite,
  content,
  includeArchived,
  locale,
  lineItemTemplate,
}: LineItemTemplateRowProps) {
  return (
    <DataTableRow mobileCard>
      <DataTableHeaderCell className={styles.titleCell} scope="row">
        {lineItemTemplate.title}
      </DataTableHeaderCell>
      <DataTableCell>
        {formatPrice(lineItemTemplate, locale, content)}
      </DataTableCell>
      <DataTableCell>
        {content.list.pricingMode[lineItemTemplate.pricingMode]}
      </DataTableCell>
      <DataTableCell>
        <LineItemTemplateStatusBadge
          label={content.list.status[lineItemTemplate.status]}
          status={lineItemTemplate.status}
        />
      </DataTableCell>
      <DataTableCell className={styles.actionsCell}>
        {canWrite ? (
          <ButtonLink
            href={buildLineItemTemplateEditHref(
              basePath,
              lineItemTemplate.id,
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
