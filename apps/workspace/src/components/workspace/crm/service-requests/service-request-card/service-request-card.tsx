import type { ReactNode } from "react";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { Badge } from "@invessiv/ui";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { Locale } from "@/config/i18n";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { ServiceRequestStatusBadge } from "../service-request-status-badge/service-request-status-badge";
import styles from "./service-request-card.module.css";
export type ServiceRequestCardProps = {
  request: ServiceRequestDto;
  content: CrmServiceRequestsDictionary;
  locale: Locale;
  crmPath: string;
  href?: string;
  highlighted?: boolean;
  actions?: ReactNode;
};
export function ServiceRequestCard({
  request: r,
  content,
  locale,
  crmPath,
  href,
  highlighted,
  actions,
}: ServiceRequestCardProps) {
  return (
    <article
      className={styles.card}
      data-highlighted={highlighted || undefined}
      aria-label={r.title}
    >
      {href ? (
        <p className={styles.customer}>
          {r.customerDisplayName} · {formatCustomerNumber(r.customerNumber)}
        </p>
      ) : null}
      <header className={styles.header}>
        <h4 className={styles.title}>{r.title}</h4>
        <div className={styles.badges}>
          <Badge
            kind="status"
            icon={faLayerGroup}
            label={content.kind[r.kind]}
            tone={BadgeTone.Neutral}
          />
          <ServiceRequestStatusBadge
            status={r.status}
            label={content.status[r.status]}
          />
        </div>
      </header>
      <p className={styles.meta}>
        {formatMessage(content.card.by, {
          name: r.requestedByName || content.card.unknownContact,
        })}
        <span aria-hidden="true"> · </span>
        <time dateTime={r.createdAt}>
          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(r.createdAt),
          )}
        </time>
      </p>
      {r.note ? <p className={styles.note}>{r.note}</p> : null}
      <p className={styles.wish}>
        {r.projectWish === ServiceRequestProjectWish.Existing
          ? (r.requestedProjectTitle ?? content.card.projectUnavailable)
          : content.wish[r.projectWish]}
        {r.requestedMinutes !== null ? (
          <>
            {" "}
            ·{" "}
            {formatMessage(content.card.quantity, {
              duration: formatDuration(r.requestedMinutes),
            })}
          </>
        ) : null}
      </p>
      {r.status === ServiceRequestStatus.Declined && r.declineReason ? (
        <p className={styles.reason}>{r.declineReason}</p>
      ) : null}
      {r.status === ServiceRequestStatus.Accepted && r.projectId ? (
        <Link
          className={styles.link}
          href={buildCustomerCockpitHref(crmPath, r.customerId, "", {
            projectId: r.projectId,
          })}
          scroll={false}
        >
          {content.card.project}
        </Link>
      ) : null}
      {href ? (
        <Link className={styles.link} href={href} scroll={false}>
          {content.card.open}
        </Link>
      ) : null}
      {actions}
    </article>
  );
}
