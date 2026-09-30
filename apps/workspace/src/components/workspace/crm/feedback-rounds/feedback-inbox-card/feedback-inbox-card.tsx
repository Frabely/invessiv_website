import Link from "next/link";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FeedbackInboxItemDto } from "@invessiv/common/contracts/crm/feedback-inbox-item.dto";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FeedbackRoundStatusBadge } from "@/components/shared/feedback/feedback-round-status-badge/feedback-round-status-badge";
import type { Locale } from "@/config/i18n";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./feedback-inbox-card.module.css";

export type FeedbackInboxCardProps = {
  content: CrmFeedbackRoundsDictionary;
  /** Customer cockpit with the project tab and this round open. */
  href: string;
  item: FeedbackInboxItemDto;
  locale: Locale;
};

/**
 * One round waiting for the team. The link covers the whole card but only carries the round's
 * name, so the customer's text stays readable as text instead of becoming a link label.
 */
export function FeedbackInboxCard({
  content,
  href,
  item,
  locale,
}: FeedbackInboxCardProps) {
  const texts = content.inbox.card;
  return (
    <li className={styles.card} data-unread={item.unread ? "true" : "false"}>
      <div className={styles.top}>
        <p className={styles.context}>
          <span className={styles.customer}>{item.customerDisplayName}</span>
          <span className={styles.project}>{item.projectTitle}</span>
        </p>
        <div className={styles.badges}>
          {item.unread ? (
            <span className={styles.unread}>
              <FontAwesomeIcon aria-hidden="true" icon={faCircle} />
              {texts.unread}
            </span>
          ) : null}
          <FeedbackRoundStatusBadge
            label={content.status[item.status]}
            status={item.status}
          />
        </div>
      </div>
      <h2 className={styles.title}>
        <Link
          aria-label={formatMessage(texts.open, {
            customer: item.customerDisplayName,
            project: item.projectTitle,
            number: item.roundNumber,
          })}
          className={styles.link}
          href={href}
        >
          {formatMessage(texts.round, { number: item.roundNumber })}
        </Link>
      </h2>
      <p
        className={styles.excerpt}
        data-empty={item.excerpt ? "false" : "true"}
      >
        {item.excerpt ?? texts.noExcerpt}
      </p>
      <p className={styles.meta}>
        <span>
          {formatMessage(texts.submitted, {
            date: formatMomentDay(item.submittedAt, locale),
          })}
        </span>
        {item.dueOn ? (
          <span>
            {formatMessage(texts.due, {
              date: formatCalendarDay(item.dueOn, locale),
            })}
          </span>
        ) : null}
        <span className={styles.count}>
          {formatCountMessage(item.itemCount, {
            none: content.row.itemsNone,
            one: content.row.itemsOne,
            many: content.row.items,
          })}
        </span>
        {item.fileCount > 0 ? (
          <span className={styles.count}>
            {formatCountMessage(item.fileCount, {
              one: texts.filesOne,
              many: texts.files,
            })}
          </span>
        ) : null}
      </p>
    </li>
  );
}
