import type { Ref } from "react";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonLink, LinkedText } from "@invessiv/ui";
import { PortalStepHeading } from "@/components/portal/shared/portal-step-heading/portal-step-heading";
import { FeedbackRoundStatusBadge } from "@/components/shared/feedback/feedback-round-status-badge/feedback-round-status-badge";
import type { Locale } from "@/config/i18n";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./feedback-round-head.module.css";

export type FeedbackRoundHeadProps = {
  content: PortalFeedbackDictionary;
  headingId: string;
  headingRef: Ref<HTMLHeadingElement>;
  locale: Locale;
  round: PortalFeedbackRoundDto;
};

/** The latest date of the round worth naming: approved, implemented, submitted, else the due date. */
function milestone(
  round: PortalFeedbackRoundDto,
  content: PortalFeedbackDictionary,
  locale: Locale,
): { dateTime: string; text: string } | null {
  const texts = content.round;
  if (round.approvedAt)
    return {
      dateTime: round.approvedAt,
      text: formatMessage(texts.approvedOn, {
        date: formatMomentDay(round.approvedAt, locale),
      }),
    };
  if (round.completedAt)
    return {
      dateTime: round.completedAt,
      text: formatMessage(texts.completedOn, {
        date: formatMomentDay(round.completedAt, locale),
      }),
    };
  if (round.submittedAt)
    return {
      dateTime: round.submittedAt,
      text: formatMessage(texts.submittedOn, {
        date: formatMomentDay(round.submittedAt, locale),
      }),
    };
  if (round.dueOn)
    return {
      dateTime: round.dueOn,
      text: formatMessage(texts.due, {
        date: formatCalendarDay(round.dueOn, locale),
      }),
    };
  return null;
}

/**
 * The head of a round: its name and state, the date that matters now, and what the team handed
 * over with it, the preview and what is new.
 */
export function FeedbackRoundHead({
  content,
  headingId,
  headingRef,
  locale,
  round,
}: FeedbackRoundHeadProps) {
  const date = milestone(round, content, locale);
  const hasHandover = round.previewUrl !== null || round.handoverNote !== null;

  return (
    <header className={styles.head}>
      <div className={styles.titleRow}>
        <PortalStepHeading id={headingId} ref={headingRef}>
          {formatMessage(content.round.title, { number: round.roundNumber })}
        </PortalStepHeading>
        <FeedbackRoundStatusBadge
          label={content.status[round.status]}
          status={round.status}
        />
      </div>
      {date ? (
        <p className={styles.date}>
          <time dateTime={date.dateTime}>{date.text}</time>
        </p>
      ) : null}
      {hasHandover ? (
        <div className={styles.handover}>
          {round.handoverNote ? (
            <div className={styles.note}>
              <h3 className={styles.noteTitle}>{content.round.handoverNote}</h3>
              <p className={styles.noteText}>
                <LinkedText text={round.handoverNote} />
              </p>
            </div>
          ) : null}
          {round.previewUrl ? (
            <ButtonLink
              className={styles.preview}
              href={round.previewUrl}
              rel="noopener noreferrer"
              size={ButtonSize.Control}
              target="_blank"
              variant={ButtonVariant.Ghost}
            >
              {content.round.preview}
              <span className="sr-only"> ({content.round.previewNewTab})</span>
              <FontAwesomeIcon
                aria-hidden="true"
                icon={faArrowUpRightFromSquare}
              />
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
