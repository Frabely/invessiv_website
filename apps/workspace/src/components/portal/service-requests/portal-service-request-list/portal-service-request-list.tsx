import type { PortalServiceRequestListDictionary } from "@/common/contracts/portal/portal-service-request-list-dictionary";
import type { ReactNode } from "react";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { OPEN_SERVICE_REQUEST_STATUS_VALUES } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { PortalServiceRequestLimits } from "@invessiv/common/constants/portal/portal-service-request-limits";
import type { PortalServiceRequestDto } from "@invessiv/common/contracts/portal/portal-service-request.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { ButtonControl } from "@invessiv/ui";
import { ServiceRequestStatusBadge } from "@/components/shared/service-requests/service-request-status-badge/service-request-status-badge";
import type { Locale } from "@/config/i18n";
import { formatTimestampDay } from "@/lib/i18n/format-timestamp-day";
import styles from "./portal-service-request-list.module.css";

export type PortalServiceRequestListProps = {
  content: PortalServiceRequestListDictionary;
  locale: Locale;
  /** Asks to withdraw; the dialog confirms first. Only called for a request with `canWithdraw`. */
  onWithdrawAction: (request: PortalServiceRequestDto) => void;
  /** Explains the read-only owner view; null for contacts. */
  ownerNotice: ReactNode;
  /** Newest first: every open request and the capped history of closed requests. */
  requests: readonly PortalServiceRequestDto[];
};

/** Where a request points, as the contact said it; an existing project is named by its title. */
function projectLine(
  request: PortalServiceRequestDto,
  content: PortalServiceRequestListDictionary,
): string | null {
  if (request.projectTitle)
    return formatMessage(content.project, { project: request.projectTitle });
  if (request.projectWish === Wish.Existing) return null;
  return content.wish[request.projectWish];
}

/**
 * The company's own requests with their status as badge and text. Note and decline reason are
 * customer and team text and rendered as plain text only.
 */
export function PortalServiceRequestList({
  content,
  locale,
  onWithdrawAction,
  ownerNotice,
  requests,
}: PortalServiceRequestListProps) {
  const historyCount = requests.filter(
    (request) =>
      !OPEN_SERVICE_REQUEST_STATUS_VALUES.some(
        (status) => status === request.status,
      ),
  ).length;
  if (requests.length === 0)
    return (
      <>
        <p className={styles.empty}>{content.empty}</p>
        {ownerNotice}
      </>
    );

  return (
    <>
      <ul className={styles.list}>
        {requests.map((request) => {
          const project = projectLine(request, content);
          return (
            <li className={styles.row} key={request.id}>
              <div className={styles.head}>
                <p className={styles.title}>{request.title}</p>
                <ServiceRequestStatusBadge
                  label={content.status[request.status]}
                  status={request.status}
                />
              </div>
              <p className={styles.meta}>
                <span>
                  {formatMessage(content.requestedOn, {
                    date: formatTimestampDay(request.createdAt, locale),
                  })}
                </span>
                {project ? <span>{project}</span> : null}
                {request.kind === LineItemKind.Hours &&
                request.requestedMinutes !== null ? (
                  <span>
                    {formatMessage(content.hours, {
                      duration: formatDuration(request.requestedMinutes),
                    })}
                  </span>
                ) : null}
              </p>
              {request.note ? (
                <p className={styles.text}>
                  <span className={styles.label}>{content.noteLabel}</span>
                  {request.note}
                </p>
              ) : null}
              {request.declineReason ? (
                <p className={styles.text} data-kind="reply">
                  <span className={styles.label}>
                    {content.declineReasonLabel}
                  </span>
                  {request.declineReason}
                </p>
              ) : null}
              {request.canWithdraw ? (
                <div className={styles.actions}>
                  <ButtonControl
                    aria-label={formatMessage(content.withdrawLabel, {
                      title: request.title,
                    })}
                    onClick={() => onWithdrawAction(request)}
                    type="button"
                    variant="ghost"
                  >
                    {content.withdraw}
                  </ButtonControl>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {historyCount >= PortalServiceRequestLimits.HistoryShown ? (
        <p className={styles.capped}>
          {formatMessage(content.capped, {
            count: PortalServiceRequestLimits.HistoryShown,
          })}
        </p>
      ) : null}
      {ownerNotice}
    </>
  );
}
