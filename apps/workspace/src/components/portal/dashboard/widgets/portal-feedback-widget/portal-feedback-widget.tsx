"use client";

import Link from "next/link";
import { faHighlighter } from "@fortawesome/free-solid-svg-icons";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalFeedbackSummaryDto } from "@invessiv/common/contracts/portal/portal-feedback-summary.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { Widget } from "@invessiv/ui";
import { PORTAL_WIDGET_ACCENTS } from "@/common/constants/portal/portal-widget-accents";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { buildPortalFeedbackPath } from "@/common/patterns/portal/portal-feedback-path";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";
import { FeedbackRoundStatusBadge } from "@/components/shared/feedback/feedback-round-status-badge/feedback-round-status-badge";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./portal-feedback-widget.module.css";

export type PortalFeedbackWidgetProps = {
  content: PortalDashboardDictionary["widgets"]["feedback"];
  customerId: string;
  /** Null while the selected project has no round steps, or without a project. */
  entry: PortalFeedbackSummaryDto | null;
  locale: Locale;
};

type Content = PortalFeedbackWidgetProps["content"];

/** After the last completed round nothing but the approval is left; it is the customer's turn. */
function isApprovalDue(entry: PortalFeedbackSummaryDto): boolean {
  return (
    entry.status === FeedbackRoundStatus.Completed &&
    entry.used >= entry.included
  );
}

function turnLabel(
  entry: PortalFeedbackSummaryDto,
  content: Content,
  locale: Locale,
): string {
  if (!entry.status) return content.turn.none;
  if (isApprovalDue(entry)) return content.turn.approvalDue;
  if (entry.status === FeedbackRoundStatus.Approved && entry.approvedAt)
    return formatMessage(content.approvedOn, {
      date: formatMomentDay(entry.approvedAt, locale),
    });
  return content.turn[entry.status];
}

function linkLabels(entry: PortalFeedbackSummaryDto, content: Content) {
  if (entry.status === FeedbackRoundStatus.Open)
    return { text: content.give, named: content.giveNamed };
  if (isApprovalDue(entry))
    return { text: content.approve, named: content.approveNamed };
  return { text: content.view, named: content.viewNamed };
}

/** For the selected project: which round, whose turn, until when, and the way to the sheet. */
export function PortalFeedbackWidget({
  content,
  customerId,
  entry,
  locale,
}: PortalFeedbackWidgetProps) {
  const yourTurn =
    entry !== null &&
    (entry.status === FeedbackRoundStatus.Open || isApprovalDue(entry));
  const link = entry ? linkLabels(entry, content) : null;
  const common = {
    accent: PORTAL_WIDGET_ACCENTS[PortalWidgetKey.Feedback],
    icon: faHighlighter,
    title: content.title,
  };
  const body =
    !entry || !link ? (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>{content.emptyTitle}</p>
        <p>{content.emptyDescription}</p>
      </div>
    ) : (
      <div className={styles.item}>
        <div className={styles.text}>
          <span className={styles.project}>{entry.projectTitle}</span>
          <span className={styles.meta}>
            {entry.roundNumber
              ? formatMessage(content.roundOf, {
                  number: entry.roundNumber,
                  included: Math.max(entry.included, entry.used),
                })
              : content.noRound}
            {entry.dueOn && entry.status === FeedbackRoundStatus.Open ? (
              <time dateTime={entry.dueOn}>
                {formatMessage(content.due, {
                  date: formatCalendarDay(entry.dueOn, locale),
                })}
              </time>
            ) : null}
          </span>
        </div>
        {entry.status ? (
          <FeedbackRoundStatusBadge
            label={turnLabel(entry, content, locale)}
            status={entry.status}
          />
        ) : (
          <span className={styles.none}>{content.turn.none}</span>
        )}
      </div>
    );

  if (!entry?.status || !link) {
    return (
      <Widget {...common} openMode={WidgetOpenMode.None}>
        {body}
      </Widget>
    );
  }

  return (
    <Widget
      {...common}
      href={buildPortalHref(
        buildPortalFeedbackPath({
          locale,
          customerId,
          projectId: entry.projectId,
        }),
        "",
        { project: entry.projectId },
      )}
      linkComponent={Link}
      openAccessibleLabel={formatMessage(link.named, {
        project: entry.projectTitle,
      })}
      openLabel={link.text}
      openMode={WidgetOpenMode.Page}
      openProminent={yourTurn}
    >
      {body}
    </Widget>
  );
}
