import Link from "next/link";
import { faCirclePlus, faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PortalFeedbackExhaustedDictionary } from "@/common/contracts/portal/portal-feedback-exhausted-dictionary";
import styles from "./feedback-quota-notice.module.css";

export type FeedbackQuotaNoticeProps = {
  content: PortalFeedbackExhaustedDictionary;
  /** Messages page; null without chat access, the notice then only explains. */
  messagesHref: string | null;
  /**
   * The service request dialog, opened on the further round for this project. Null when no such
   * service is offered for the project or the reader may not request; the chat link then stays.
   */
  requestHref?: string | null;
};

/** Every round is used: a further one is requested as a service, or discussed in the chat. */
export function FeedbackQuotaNotice({
  content,
  messagesHref,
  requestHref = null,
}: FeedbackQuotaNoticeProps) {
  const link = requestHref
    ? { href: requestHref, icon: faCirclePlus, label: content.requestLink }
    : messagesHref
      ? { href: messagesHref, icon: faComments, label: content.chatLink }
      : null;

  return (
    <div className={styles.notice}>
      <h2>{content.title}</h2>
      <p>{requestHref ? content.requestDescription : content.description}</p>
      {link ? (
        <Link className={styles.link} href={link.href}>
          <FontAwesomeIcon aria-hidden="true" icon={link.icon} />
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}
