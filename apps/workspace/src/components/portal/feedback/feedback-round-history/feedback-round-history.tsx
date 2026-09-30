"use client";

import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { FeedbackRoundStatusBadge } from "@/components/shared/feedback/feedback-round-status-badge/feedback-round-status-badge";
import type { Locale } from "@/config/i18n";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { FeedbackItemList } from "../feedback-item-list/feedback-item-list";
import styles from "./feedback-round-history.module.css";

export type FeedbackRoundHistoryProps = {
  content: PortalFeedbackDictionary;
  customerId: string;
  filesContent: PortalFilesDictionary;
  locale: Locale;
  /** Finished rounds, newest first. */
  rounds: readonly PortalFeedbackRoundDto[];
};

function milestone(
  round: PortalFeedbackRoundDto,
  texts: PortalFeedbackDictionary["history"],
  locale: Locale,
): string | null {
  if (round.approvedAt)
    return formatMessage(texts.approvedOn, {
      date: formatMomentDay(round.approvedAt, locale),
    });
  if (round.submittedAt)
    return formatMessage(texts.submittedOn, {
      date: formatMomentDay(round.submittedAt, locale),
    });
  return null;
}

/** Earlier rounds, folded by default; opening one shows its points and files. */
export function FeedbackRoundHistory({
  content,
  customerId,
  filesContent,
  locale,
  rounds,
}: FeedbackRoundHistoryProps) {
  if (rounds.length === 0) return null;
  const texts = content.history;

  return (
    <section aria-labelledby="feedback-history" className={styles.history}>
      <h2 className={styles.title} id="feedback-history">
        {texts.title}
      </h2>
      <ul className={styles.list}>
        {rounds.map((round) => {
          const date = milestone(round, texts, locale);
          return (
            <li key={round.id}>
              <details className={styles.round}>
                <summary className={styles.summary}>
                  <span className={styles.name}>
                    {formatMessage(texts.roundTitle, {
                      number: round.roundNumber,
                    })}
                  </span>
                  <FeedbackRoundStatusBadge
                    label={content.status[round.status]}
                    status={round.status}
                  />
                  <span className={styles.meta}>
                    {date ? `${date} · ` : null}
                    {formatCountMessage(round.items.length, {
                      none: texts.itemsNone,
                      one: texts.itemsOne,
                      many: texts.items,
                    })}
                  </span>
                </summary>
                {round.items.length > 0 ? (
                  <FeedbackItemList
                    content={content}
                    customerId={customerId}
                    filesContent={filesContent}
                    items={round.items}
                    locale={locale}
                  />
                ) : null}
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
