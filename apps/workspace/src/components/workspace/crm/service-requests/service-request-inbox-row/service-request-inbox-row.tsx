import Link from "next/link";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { DataTableCell, DataTableHeaderCell, DataTableRow } from "@invessiv/ui";
import { describeServiceRequestProjectWish } from "@/common/patterns/crm/service-requests/service-request-project-wish-label";
import type { Locale } from "@/config/i18n";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { ServiceRequestKindBadge } from "../service-request-kind-badge/service-request-kind-badge";
import { ServiceRequestStatusBadge } from "../service-request-status-badge/service-request-status-badge";
import styles from "./service-request-inbox-row.module.css";

type ServiceRequestInboxRowProps = {
  content: CrmServiceRequestsDictionary;
  /** Opens the request in the cockpit of its customer, where it is worked on. */
  href: string;
  locale: Locale;
  request: ServiceRequestDto;
};

export function ServiceRequestInboxRow({
  content,
  href,
  locale,
  request,
}: ServiceRequestInboxRowProps) {
  const columns = content.table.columns;

  return (
    <DataTableRow mobileCard>
      <DataTableCell
        className={styles.receivedCell}
        mobileCardSlot="supportingPrimary"
        mobileLabel={columns.received}
      >
        <time dateTime={request.createdAt}>
          {formatMomentDay(request.createdAt, locale)}
        </time>
      </DataTableCell>
      <DataTableHeaderCell
        className={styles.requestCell}
        mobileCardSlot="primary"
        scope="row"
      >
        <Link
          aria-label={formatMessage(content.table.openNamed, {
            name: request.title,
          })}
          className={styles.title}
          href={href}
          scroll={false}
        >
          {request.title}
        </Link>
        {request.requestedMinutes !== null ? (
          <span className={styles.quantity}>
            {formatMessage(content.details.quantity, {
              duration: formatDuration(request.requestedMinutes),
            })}
          </span>
        ) : null}
        {request.note ? (
          <span className={styles.note}>{request.note}</span>
        ) : null}
      </DataTableHeaderCell>
      <DataTableCell
        className={styles.kindCell}
        mobileCardSlot="supportingSecondary"
        mobileLabel={columns.kind}
      >
        <ServiceRequestKindBadge label={content.kind[request.kind]} />
      </DataTableCell>
      <DataTableCell mobileCardSlot="secondary">
        <ServiceRequestStatusBadge
          label={content.status[request.status]}
          status={request.status}
        />
      </DataTableCell>
      <DataTableCell
        className={styles.customerCell}
        mobileCardSlot="supportingPrimary"
        mobileLabel={columns.customer}
      >
        <span className={styles.customer}>{request.customerDisplayName}</span>
        <span className={styles.customerNumber}>
          {formatCustomerNumber(request.customerNumber)}
        </span>
      </DataTableCell>
      <DataTableCell
        className={styles.contactCell}
        mobileCardSlot="supportingSecondary"
        mobileLabel={columns.contact}
      >
        <span>{request.requestedByName || content.details.unknownContact}</span>
      </DataTableCell>
      <DataTableCell
        className={styles.wishCell}
        mobileCardSlot="supportingPrimary"
        mobileLabel={columns.wish}
      >
        <span>{describeServiceRequestProjectWish(request, content)}</span>
      </DataTableCell>
    </DataTableRow>
  );
}
