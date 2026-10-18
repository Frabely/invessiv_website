import { Children, type ReactNode, useId } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LinkedText } from "@invessiv/ui";
import type { FeedbackNoticeTone } from "@/common/constants/portal/feedback-notice-tones";
import styles from "./feedback-state-notice.module.css";

export type FeedbackStateNoticeProps = {
  /** Ways out, such as the chat or a booking link, below the text. */
  children?: ReactNode;
  description: string | null;
  icon: IconDefinition;
  /** What the team wrote; plain text, links become clickable. Null when they wrote nothing. */
  notice?: string | null;
  noticeLabel?: string;
  /** 3 inside a round, under its heading; 2 where the notice stands alone on the page. */
  headingLevel?: 2 | 3;
  title: string;
  tone: FeedbackNoticeTone;
};

/**
 * Where a round stands and whose turn it is, at the top of the round. Colour, icon and title
 * say the same thing, so the state never reads by colour alone.
 */
export function FeedbackStateNotice({
  children,
  description,
  headingLevel = 3,
  icon,
  notice = null,
  noticeLabel,
  title,
  tone,
}: FeedbackStateNoticeProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={styles.notice}
      data-tone={tone}
    >
      <span aria-hidden="true" className={styles.icon}>
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className={styles.text}>
        <Heading className={styles.title} id={headingId}>
          {title}
        </Heading>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
        {notice ? (
          <blockquote className={styles.quote}>
            {noticeLabel ? (
              <span className={styles.quoteLabel}>{noticeLabel}</span>
            ) : null}
            <p>
              <LinkedText text={notice} />
            </p>
          </blockquote>
        ) : null}
        {Children.toArray(children).length > 0 ? (
          <div className={styles.actions}>{children}</div>
        ) : null}
      </div>
    </section>
  );
}
