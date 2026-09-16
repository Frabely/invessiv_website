import Link from "next/link";
import {
  faAddressBook,
  faEllipsisVertical,
  faPenToSquare,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import {
  DataTableCell,
  DataTableHeaderCell,
  DataTableLayout,
  DataTableRow,
  EmptyState,
  PrimaryCtaLink,
  TableRowActions,
} from "@invessiv/ui";
import { buildCustomerEditHref } from "@/common/patterns/crm/customer-dialog-query";
import type { CrmListDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { CustomerStatusBadge } from "../customer-status-badge/customer-status-badge";
import styles from "./customers-basic-list.module.css";

type CustomersBasicListProps = {
  content: CrmListDictionary;
  /** Null without `customers.write`: no create or edit actions are rendered. */
  basePath: string | null;
  createHref: string | null;
  customers: CustomerSummaryDto[];
};

export function CustomersBasicList({
  basePath,
  content,
  createHref,
  customers,
}: CustomersBasicListProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        action={
          createHref ? (
            <PrimaryCtaLink
              href={createHref}
              linkComponent={Link}
              linkComponentProps={{ scroll: false }}
            >
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.icon}
                icon={faPlus}
              />
              {content.empty.action}
            </PrimaryCtaLink>
          ) : undefined
        }
        description={content.empty.description}
        icon={<FontAwesomeIcon icon={faAddressBook} />}
        title={content.empty.title}
      />
    );
  }

  const columns = [
    { header: content.columns.number, id: "number", width: 104 },
    { header: content.columns.customer, id: "customer" },
    { header: content.columns.status, id: "status", width: 136 },
    {
      header: content.columns.primaryContact,
      id: "primary-contact",
      width: 224,
    },
    ...(basePath
      ? [
          {
            header: content.columns.actions,
            id: "actions",
            isPinned: true,
            isVisuallyHidden: true,
            width: 128,
          },
        ]
      : []),
  ];

  return (
    <DataTableLayout
      ariaLabel={content.caption}
      caption={content.caption}
      columns={columns}
      responsiveMode="scroll"
      tableClassName={styles.table}
    >
      {customers.map((customer) => (
        <DataTableRow className={styles.row} key={customer.id}>
          <DataTableCell className={styles.numberCell}>
            <span className={styles.number}>
              {formatCustomerNumber(customer.customerNumber)}
            </span>
          </DataTableCell>
          <DataTableHeaderCell className={styles.customerCell} scope="row">
            <span className={styles.name}>{customer.displayName}</span>
            <span className={styles.meta}>
              {[
                customer.companyName ??
                  content.customerType[customer.customerType],
                customer.city,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </DataTableHeaderCell>
          <DataTableCell className={styles.statusCell}>
            <CustomerStatusBadge
              label={content.status[customer.status]}
              status={customer.status}
            />
          </DataTableCell>
          <DataTableCell className={styles.contactCell}>
            <span className={styles.contactName}>
              {customer.primaryContactName}
            </span>
            {customer.primaryContactEmail ? (
              <span className={styles.meta}>
                {customer.primaryContactEmail}
              </span>
            ) : null}
          </DataTableCell>
          {basePath ? (
            <TableRowActions
              className={styles.actionsCell}
              isPinned
              menuIcon={
                <FontAwesomeIcon aria-hidden="true" icon={faEllipsisVertical} />
              }
              menuLabel={content.columns.actions}
            >
              <Link
                aria-label={formatMessage(content.editActionAriaLabel, {
                  name: customer.displayName,
                })}
                href={buildCustomerEditHref(basePath, customer.id)}
                scroll={false}
                title={content.editAction}
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={styles.icon}
                  icon={faPenToSquare}
                />
              </Link>
            </TableRowActions>
          ) : null}
        </DataTableRow>
      ))}
    </DataTableLayout>
  );
}
