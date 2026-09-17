import Link from "next/link";
import {
  faEllipsisVertical,
  faEye,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import {
  DataTableCell,
  DataTableHeaderCell,
  DataTableRow,
  TableRowActions,
} from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmListDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { formatMessage } from "@/lib/i18n/format-message";
import {
  buildCustomerCockpitHref,
  buildCustomerEditHref,
} from "@/common/patterns/crm/customer-dialog-query";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CustomerStatusBadge } from "../customer-status-badge/customer-status-badge";
import styles from "./customer-table-row.module.css";

type CustomerTableRowProps = {
  basePath: string;
  canWrite: boolean;
  content: CrmListDictionary;
  customer: CustomerSummaryDto;
  locale: Locale;
  queryString: string;
};

export function CustomerTableRow({
  basePath,
  canWrite,
  content,
  customer,
  locale,
  queryString,
}: CustomerTableRowProps) {
  const updated = formatRelativeTime(
    locale,
    customer.updatedAt,
    content.relativeTime,
  );
  const cockpit = getCrmCockpitDictionary(locale);

  return (
    <DataTableRow className={styles.row} mobileCard>
      <DataTableCell className={styles.numberCell}>
        <span className={styles.number}>
          {formatCustomerNumber(customer.customerNumber)}
        </span>
      </DataTableCell>
      <DataTableHeaderCell className={styles.customerCell} scope="row">
        <span className={styles.name}>{customer.displayName}</span>
        <span className={styles.meta}>
          {[customer.companyName, customer.city].filter(Boolean).join(", ")}
        </span>
      </DataTableHeaderCell>
      <DataTableCell className={styles.statusCell}>
        <CustomerStatusBadge
          label={content.status[customer.status]}
          status={customer.status}
        />
      </DataTableCell>
      <DataTableCell className={styles.ownerCell}>
        {customer.ownerDisplayName}
      </DataTableCell>
      <DataTableCell className={styles.contactCell}>
        <span className={styles.contactName}>
          {customer.primaryContactName}
        </span>
        {customer.primaryContactEmail ? (
          <span className={styles.meta}>{customer.primaryContactEmail}</span>
        ) : null}
      </DataTableCell>
      <DataTableCell className={styles.updatedCell} title={customer.updatedAt}>
        {updated}
      </DataTableCell>
      {
        <TableRowActions
          actionGroupId={`customer-${customer.id}-actions`}
          className={styles.actionsCell}
          isPinned
          menuIcon={
            <FontAwesomeIcon aria-hidden="true" icon={faEllipsisVertical} />
          }
          menuLabel={content.columns.actions}
        >
          <Link
            aria-label={formatMessage(cockpit.openActionAriaLabel, {
              name: customer.displayName,
            })}
            href={buildCustomerCockpitHref(basePath, customer.id, queryString)}
            scroll={false}
            title={cockpit.openAction}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faEye} />
          </Link>
          {canWrite ? (
            <Link
              aria-label={formatMessage(content.editActionAriaLabel, {
                name: customer.displayName,
              })}
              href={buildCustomerEditHref(basePath, customer.id, queryString)}
              scroll={false}
              title={content.editAction}
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
            </Link>
          ) : null}
        </TableRowActions>
      }
    </DataTableRow>
  );
}
