import { DataTableLayout, type ListPaginationProps } from "@invessiv/ui";
import type { ServiceRequestInboxDto } from "@invessiv/common/contracts/crm/service-requests/service-request-inbox.dto";
import type { ServiceRequestInboxFilter } from "@/common/constants/crm/service-request-inbox-query-params";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { buildServiceRequestInboxQueryString } from "@/common/patterns/crm/service-request-inbox-query";
import { WorkspaceScrollableTableArea } from "@/components/workspace/shared/workspace-scrollable-table-area/workspace-scrollable-table-area";
import type { Locale } from "@/config/i18n";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestInboxRow } from "../service-request-inbox-row/service-request-inbox-row";

type ServiceRequestInboxTableProps = {
  basePath: string;
  content: CrmServiceRequestsDictionary;
  /** The CRM page that opens a customer cockpit; the page owns the route. */
  crmPath: string;
  /** Kept in the page links, so paging never drops the filter. */
  filter: ServiceRequestInboxFilter;
  inbox: ServiceRequestInboxDto;
  locale: Locale;
};

export function ServiceRequestInboxTable({
  basePath,
  content,
  crmPath,
  filter,
  inbox,
  locale,
}: ServiceRequestInboxTableProps) {
  const table = content.table;
  const pagination: ListPaginationProps = {
    basePath,
    content: table.pagination,
    currentPage: inbox.page,
    perPage: inbox.perPage,
    queryString: buildServiceRequestInboxQueryString(filter),
    total: inbox.total,
  };
  const columns = [
    { header: table.columns.received, id: "received", width: 130 },
    { header: table.columns.request, id: "request", width: 340 },
    { header: table.columns.kind, id: "kind", width: 150 },
    { header: table.columns.status, id: "status", width: 190 },
    { header: table.columns.customer, id: "customer", width: 200 },
    { header: table.columns.contact, id: "contact", width: 170 },
    { header: table.columns.wish, id: "wish", width: 190 },
  ];

  return (
    <WorkspaceScrollableTableArea>
      <DataTableLayout
        ariaLabel={table.caption}
        caption={table.caption}
        columns={columns}
        fillAvailableHeight
        pagination={pagination}
        responsiveMode="cards"
      >
        {inbox.items.map((request) => (
          <ServiceRequestInboxRow
            content={content}
            href={buildCustomerCockpitHref(crmPath, request.customerId, "", {
              serviceRequestId: request.id,
            })}
            key={request.id}
            locale={locale}
            request={request}
          />
        ))}
      </DataTableLayout>
    </WorkspaceScrollableTableArea>
  );
}
