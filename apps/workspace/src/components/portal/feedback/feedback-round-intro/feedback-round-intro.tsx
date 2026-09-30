import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { LinkedText } from "@invessiv/ui";
import { FeedbackRoundStatusBadge } from "@/components/shared/feedback/feedback-round-status-badge/feedback-round-status-badge";
import type { Locale } from "@/config/i18n";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import styles from "./feedback-round-intro.module.css";

export type FeedbackRoundIntroProps = {
  content: PortalFeedbackDictionary;
  included: number;
  locale: Locale;
  round: PortalFeedbackRoundDto;
};

/** What the round is about: which round, whose turn, until when, the preview and what is new. */
export function FeedbackRoundIntro({
  content,
  included,
  locale,
  round,
}: FeedbackRoundIntroProps) {
  return (
    <header className={styles.intro}>
      <div className={styles.line}>
        <h2 className={styles.round}>
          {formatMessage(content.intro.roundOf, {
            number: round.roundNumber,
            included: Math.max(included, round.roundNumber),
          })}
        </h2>
        <FeedbackRoundStatusBadge
          label={content.status[round.status]}
          status={round.status}
        />
        {round.dueOn ? (
          <time className={styles.due} dateTime={round.dueOn}>
            {formatMessage(content.intro.due, {
              date: formatCalendarDay(round.dueOn, locale),
            })}
          </time>
        ) : null}
      </div>
      {round.previewUrl ? (
        <a
          className={styles.preview}
          href={round.previewUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {content.intro.preview}
          <span className="sr-only"> ({content.intro.previewNewTab})</span>
          <FontAwesomeIcon aria-hidden="true" icon={faArrowUpRightFromSquare} />
        </a>
      ) : null}
      {round.handoverNote ? (
        <div className={styles.note}>
          <h3>{content.intro.handoverNote}</h3>
          <p>
            <LinkedText text={round.handoverNote} />
          </p>
        </div>
      ) : null}
    </header>
  );
}
