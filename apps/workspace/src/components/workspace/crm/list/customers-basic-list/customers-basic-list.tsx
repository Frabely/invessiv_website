import Link from "next/link";
import {
  faAddressBook,
  faFilterCircleXmark,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { CustomerSort } from "@invessiv/common/constants/crm/list/customer-sort";
import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";
import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";
import {
  DataTableLayout,
  EmptyState,
  type ListPaginationProps,
  PrimaryCtaLink,
} from "@invessiv/ui";
import { CustomerListQueryParam } from "@/common/constants/crm/list/customer-list-query-params";
import { SortableHeader } from "@/components/workspace/shared/table/sortable-header/sortable-header";
import type { Locale } from "@/config/i18n";
import type { CrmListDictionary } from "@/i18n/dictionaries/workspace/crm";
import { WorkspaceScrollableTableArea } from "@/components/workspace/shared/workspace-scrollable-table-area/workspace-scrollable-table-area";
import { CustomerTableRow } from "../customer-table-row/customer-table-row";
import styles from "./customers-basic-list.module.css";

type CustomersBasicListProps = {
  content: CrmListDictionary;
  basePath: string;
  createHref: string | null;
  customerList: ListCustomersResult;
  filteredEmptyHref: string;
  locale: Locale;
  queryString: string;
  /** A customer reached only through a project-scoped grant is not itself writable. */
  writableCustomerIds: ReadonlySet<string>;
};

function getActiveSort(queryString: string): string | undefined {
  return (
    new URLSearchParams(queryString).get(CustomerListQueryParam.Sort) ??
    CustomerSort.UpdatedDesc
  );
}

export function CustomersBasicList({
  basePath,
  content,
  createHref,
  customerList,
  filteredEmptyHref,
  locale,
  queryString,
  writableCustomerIds,
}: CustomersBasicListProps) {
  const customers: CustomerSummaryDto[] = customerList.rows;
  if (customers.length === 0) {
    if (customerList.hasCustomers) {
      return (
        <EmptyState
          action={
            <PrimaryCtaLink
              href={filteredEmptyHref}
              linkComponent={Link}
              linkComponentProps={{ scroll: false }}
            >
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.icon}
                icon={faFilterCircleXmark}
              />
              {content.noResults.action}
            </PrimaryCtaLink>
          }
          description={content.noResults.description}
          icon={<FontAwesomeIcon icon={faFilterCircleXmark} />}
          title={content.noResults.title}
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

  const activeSort = getActiveSort(queryString);
  const pagination: ListPaginationProps = {
    basePath,
    content: content.pagination,
    currentPage: customerList.page,
    perPage: customerList.perPage,
    queryString,
    total: customerList.total,
  };
  const columns = [
    {
      header: (
        <SortableHeader
          activeSort={activeSort}
          ascLabel={content.sort.numberAsc}
          basePath={basePath}
          descLabel={content.sort.numberDesc}
          label={content.columns.number}
          queryString={queryString}
          sortAsc={CustomerSort.NumberAsc}
          sortDesc={CustomerSort.NumberDesc}
        />
      ),
      id: "number",
      width: 110,
    },
    {
      header: (
        <SortableHeader
          activeSort={activeSort}
          ascLabel={content.sort.nameAsc}
          basePath={basePath}
          descLabel={content.sort.nameDesc}
          label={content.columns.customer}
          queryString={queryString}
          sortAsc={CustomerSort.NameAsc}
          sortDesc={CustomerSort.NameDesc}
        />
      ),
      id: "customer",
      width: 280,
    },
    {
      header: (
        <SortableHeader
          activeSort={activeSort}
          ascLabel={content.sort.statusAsc}
          basePath={basePath}
          descLabel={content.sort.statusDesc}
          label={content.columns.status}
          queryString={queryString}
          sortAsc={CustomerSort.StatusAsc}
          sortDesc={CustomerSort.StatusDesc}
        />
      ),
      id: "status",
      width: 180,
    },
    { header: content.columns.owner, id: "owner", width: 180 },
    {
      header: content.columns.primaryContact,
      id: "primary-contact",
      width: 224,
    },
    {
      header: content.columns.oneTimePayment,
      id: "one-time-payment",
      width: 144,
    },
    {
      header: content.columns.recurringRevenue,
      id: "recurring-revenue",
      width: 144,
    },
    {
      header: (
        <SortableHeader
          activeSort={activeSort}
          ascLabel={content.sort.updatedAsc}
          basePath={basePath}
          descLabel={content.sort.updatedDesc}
          label={content.columns.updated}
          queryString={queryString}
          sortAsc={CustomerSort.UpdatedAsc}
          sortDesc={CustomerSort.UpdatedDesc}
        />
      ),
      id: "updated",
      width: 150,
    },
    {
      header: content.columns.actions,
      id: "actions",
      isPinned: true,
      isVisuallyHidden: true,
      width: 80,
    },
  ];

  return (
    <WorkspaceScrollableTableArea>
      <DataTableLayout
        ariaLabel={content.caption}
        caption={content.caption}
        columns={columns}
        fillAvailableHeight
        pagination={pagination}
        tableClassName={styles.table}
      >
        {customers.map((customer) => (
          <CustomerTableRow
            basePath={basePath}
            canWrite={writableCustomerIds.has(customer.id)}
            content={content}
            customer={customer}
            key={customer.id}
            locale={locale}
            queryString={queryString}
          />
        ))}
      </DataTableLayout>
    </WorkspaceScrollableTableArea>
  );
}
