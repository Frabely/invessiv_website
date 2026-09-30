import Link from "next/link";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LinkedText } from "@invessiv/ui";
import styles from "./feedback-team-notice.module.css";

export type FeedbackTeamNoticeProps = {
  title: string;
  description: string;
  /** What the team wrote; plain text, links become clickable. Null when they wrote nothing. */
  notice: string | null;
  noticeLabel: string;
  /** Chat page for arranging the call; null without chat access. */
  chat: { href: string; label: string } | null;
};

/** A message from the team that asks the customer to do something: talk to us, or add to the round. */
export function FeedbackTeamNotice({
  title,
  description,
  notice,
  noticeLabel,
  chat,
}: FeedbackTeamNoticeProps) {
  return (
    <section aria-label={title} className={styles.notice}>
      <h2>{title}</h2>
      <p>{description}</p>
      {notice ? (
        <blockquote className={styles.quote}>
          <span className={styles.quoteLabel}>{noticeLabel}</span>
          <p>
            <LinkedText text={notice} />
          </p>
        </blockquote>
      ) : null}
      {chat ? (
        <Link className={styles.link} href={chat.href}>
          <FontAwesomeIcon aria-hidden="true" icon={faComments} />
          {chat.label}
        </Link>
      ) : null}
    </section>
  );
}
