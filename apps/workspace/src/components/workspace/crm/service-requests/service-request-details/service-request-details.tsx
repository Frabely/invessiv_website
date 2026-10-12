import Link from "next/link";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { describeServiceRequestOffer } from "@/lib/workspace/crm/describe-service-request-offer";
import { describeServiceRequestProjectWish } from "@/common/patterns/crm/service-requests/service-request-project-wish-label";
import type { Locale } from "@/config/i18n";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { ServiceRequestKindBadge } from "../service-request-kind-badge/service-request-kind-badge";
import styles from "./service-request-details.module.css";

export type ServiceRequestDetailsProps = {
  content: CrmServiceRequestsDictionary;
  /** The CRM page that opens the cockpit; the link to the resulting project is built from it. */
  crmPath: string;
  locale: Locale;
  request: ServiceRequestDto;
};

/**
 * What the customer asked for, in full: the text is theirs and only ever rendered as text. The
 * frame around it (list row, dialog) belongs to the consumer.
 */
export function ServiceRequestDetails({
  content,
  crmPath,
  locale,
  request,
}: ServiceRequestDetailsProps) {
  return (
    <div className={styles.details}>
      <p className={styles.head}>
        <span className={styles.title}>{request.title}</span>
        <ServiceRequestKindBadge label={content.kind[request.kind]} />
      </p>
      <p className={styles.meta}>
        <span>
          {formatMessage(content.details.by, {
            name: request.requestedByName || content.details.unknownContact,
          })}
        </span>
        <time dateTime={request.createdAt}>
          {formatMomentDay(request.createdAt, locale)}
        </time>
        <span>{describeServiceRequestProjectWish(request, content)}</span>
        {request.requestedMinutes !== null ? (
          <span className={styles.quantity}>
            {formatMessage(content.details.quantity, {
              duration: formatDuration(request.requestedMinutes),
            })}
          </span>
        ) : null}
      </p>
      {request.note ? <p className={styles.note}>{request.note}</p> : null}
      {request.offeredAt ? (
        <p className={styles.offer}>
          {describeServiceRequestOffer(request, content, locale)}
        </p>
      ) : null}
      {request.status === ServiceRequestStatus.Declined &&
      request.declineReason ? (
        <p className={styles.reason}>{request.declineReason}</p>
      ) : null}
      {request.status === ServiceRequestStatus.Accepted && request.projectId ? (
        <Link
          className={styles.link}
          href={buildCustomerCockpitHref(crmPath, request.customerId, "", {
            projectId: request.projectId,
          })}
          scroll={false}
        >
          {content.details.project}
        </Link>
      ) : null}
    </div>
  );
}
