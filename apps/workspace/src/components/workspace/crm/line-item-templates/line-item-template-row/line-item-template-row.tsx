import Link from "next/link";
import {
  faEllipsisVertical,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import {
  DataTableCell,
  DataTableHeaderCell,
  DataTableRow,
  TableRowActions,
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
  locale: Locale;
  lineItemTemplate: LineItemTemplateDto;
  queryString: string;
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
  locale,
  lineItemTemplate,
  queryString,
}: LineItemTemplateRowProps) {
  return (
    <DataTableRow mobileCard>
      <DataTableHeaderCell
        className={styles.titleCell}
        mobileCardSlot="primary"
        scope="row"
      >
        {lineItemTemplate.title}
      </DataTableHeaderCell>
      <DataTableCell mobileCardSlot="secondary">
        {formatPrice(lineItemTemplate, locale, content)}
      </DataTableCell>
      <DataTableCell mobileCardSlot="detail">
        {content.list.pricingMode[lineItemTemplate.pricingMode]}
      </DataTableCell>
      <DataTableCell mobileCardSlot="detail">
        <LineItemTemplateStatusBadge
          label={content.list.status[lineItemTemplate.status]}
          status={lineItemTemplate.status}
        />
      </DataTableCell>
      {canWrite ? (
        <TableRowActions
          menuIcon={
            <FontAwesomeIcon aria-hidden="true" icon={faEllipsisVertical} />
          }
          menuLabel={content.list.edit}
          mobileCardSlot="actions"
        >
          <Link
            aria-label={content.list.edit}
            href={buildLineItemTemplateEditHref(
              basePath,
              lineItemTemplate.id,
              queryString,
            )}
            scroll={false}
            title={content.list.edit}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
          </Link>
        </TableRowActions>
      ) : (
        <DataTableCell mobileCardSlot="actions" />
      )}
    </DataTableRow>
  );
}
