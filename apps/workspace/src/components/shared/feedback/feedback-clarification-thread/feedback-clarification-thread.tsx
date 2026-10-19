import { type ReactNode, useId, useState } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  FeedbackClarificationStatus,
  type FeedbackClarificationStatus as FeedbackClarificationStatusValue,
} from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import type { FeedbackItemClarificationDto } from "@invessiv/common/contracts/crm/feedback-item-clarification.dto";
import { findOpenFeedbackClarification } from "@invessiv/common/patterns/crm/find-open-feedback-clarification";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { Badge, ButtonControl } from "@invessiv/ui";
import {
  FeedbackClarificationPart,
  type FeedbackClarificationPart as FeedbackClarificationPartValue,
} from "@/common/constants/feedback/feedback-clarification-parts";
import { FEEDBACK_CLARIFICATION_STATUS_BADGES } from "@/common/constants/feedback/feedback-clarification-status-badges";
import type { FeedbackClarificationThreadLabels } from "@/common/contracts/feedback/feedback-clarification-thread-labels";
import type { Locale } from "@/config/i18n";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { FeedbackItemText } from "../feedback-item-text/feedback-item-text";
import styles from "./feedback-clarification-thread.module.css";

export type FeedbackClarificationThreadProps<
  TClarification extends FeedbackItemClarificationDto,
> = {
  clarifications: readonly TClarification[];
  /** Accessible name of the thread, e.g. "Clarifications on item 3". */
  label: string;
  labels: FeedbackClarificationThreadLabels;
  locale: Locale;
  /** Internal names per text; without a name the side's role label is shown. */
  authorName?: (
    clarification: TClarification,
    part: FeedbackClarificationPartValue,
  ) => string | null;
  /** Below the open clarification: closing in the CRM, the answer form in the portal. */
  children?: ReactNode;
};

const SIDE_OF_PART = {
  question: "team",
  answer: "customer",
  close: "team",
} as const satisfies Record<
  FeedbackClarificationPartValue,
  "team" | "customer"
>;

function statusLabel(
  status: FeedbackClarificationStatusValue,
  labels: FeedbackClarificationThreadLabels,
): string {
  switch (status) {
    case FeedbackClarificationStatus.Open:
      return labels.statusOpen;
    case FeedbackClarificationStatus.Answered:
      return labels.statusAnswered;
    default:
      return labels.statusClosed;
  }
}

/**
 * The questions on one item and what became of them, oldest first. The open question and the
 * latest finished one always show; older finished ones fold away. Plain text only, the status is
 * always written out.
 */
export function FeedbackClarificationThread<
  TClarification extends FeedbackItemClarificationDto,
>({
  clarifications,
  label,
  labels,
  locale,
  authorName,
  children,
}: FeedbackClarificationThreadProps<TClarification>) {
  const earlierId = useId();
  const [expanded, setExpanded] = useState(false);
  const open = findOpenFeedbackClarification(clarifications);
  const finished = clarifications.filter(
    (clarification) => clarification !== open,
  );
  const earlier = finished.slice(0, -1);
  const latest = finished.slice(-1);
  if (clarifications.length === 0) return null;

  function message(
    clarification: TClarification,
    part: FeedbackClarificationPartValue,
    text: string,
    at: string,
  ) {
    const side = SIDE_OF_PART[part];
    const name =
      authorName?.(clarification, part) ??
      (side === "team" ? labels.team : labels.customer);
    return (
      <div className={styles.message} data-part={part} data-side={side}>
        {part === FeedbackClarificationPart.Close ? (
          <span className={styles.noteLabel}>{labels.closeNote}</span>
        ) : null}
        <span className={styles.byline}>
          {formatMessage(labels.byline, {
            name,
            date: formatMomentDay(at, locale),
          })}
        </span>
        <FeedbackItemText
          labels={{ showMore: labels.showMore, showLess: labels.showLess }}
          text={text}
        />
      </div>
    );
  }

  function entry(clarification: TClarification) {
    const badge = FEEDBACK_CLARIFICATION_STATUS_BADGES[clarification.status];
    return (
      <li
        className={styles.entry}
        data-status={clarification.status}
        key={clarification.id}
      >
        <Badge
          icon={badge.icon}
          kind="status"
          label={statusLabel(clarification.status, labels)}
          tone={badge.tone}
        />
        {message(
          clarification,
          FeedbackClarificationPart.Question,
          clarification.question,
          clarification.requestedAt,
        )}
        {clarification.answer && clarification.answeredAt
          ? message(
              clarification,
              FeedbackClarificationPart.Answer,
              clarification.answer,
              clarification.answeredAt,
            )
          : null}
        {clarification.closeNote && clarification.closedAt
          ? message(
              clarification,
              FeedbackClarificationPart.Close,
              clarification.closeNote,
              clarification.closedAt,
            )
          : null}
        {clarification === open && children ? (
          <div className={styles.slot}>{children}</div>
        ) : null}
      </li>
    );
  }

  return (
    <section aria-label={label} className={styles.thread}>
      {earlier.length > 0 ? (
        <>
          <ButtonControl
            aria-controls={earlierId}
            aria-expanded={expanded}
            className={styles.toggle}
            onClick={() => setExpanded((current) => !current)}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon
              aria-hidden="true"
              className={styles.chevron}
              icon={faChevronDown}
            />
            {formatMessage(labels.earlier, { count: earlier.length })}
          </ButtonControl>
          <ol className={styles.list} hidden={!expanded} id={earlierId}>
            {earlier.map(entry)}
          </ol>
        </>
      ) : null}
      <ol className={styles.list}>
        {latest.map(entry)}
        {open ? entry(open) : null}
      </ol>
    </section>
  );
}
