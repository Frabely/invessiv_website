import Link from "next/link";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import styles from "./feedback-quota-notice.module.css";

export type FeedbackQuotaNoticeProps = {
  content: PortalFeedbackDictionary["states"]["exhausted"];
  /** Messages page; null without chat access, the notice then only explains. */
  messagesHref: string | null;
};

/** Every round is used: further wishes go through the chat instead of a new round. */
export function FeedbackQuotaNotice({
  content,
  messagesHref,
}: FeedbackQuotaNoticeProps) {
  return (
    <div className={styles.notice}>
      <h2>{content.title}</h2>
      <p>{content.description}</p>
      {messagesHref ? (
        <Link className={styles.link} href={messagesHref}>
          <FontAwesomeIcon aria-hidden="true" icon={faComments} />
          {content.chatLink}
        </Link>
      ) : null}
    </div>
  );
}
