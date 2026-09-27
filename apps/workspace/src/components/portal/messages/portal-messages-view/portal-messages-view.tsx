import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { PortalConversation } from "@/components/portal/messages/portal-conversation/portal-conversation";
import type { Locale } from "@/config/i18n";
import type { PortalMessagesDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-messages-view.module.css";

export type PortalMessagesViewProps = {
  cockpitHref: string | null;
  content: PortalMessagesDictionary;
  conversation: PortalConversationDto;
  customerId: string;
  locale: Locale;
  viewerUserId: string;
};

/** Full-page conversation; mount with `key={customerId}` so no thread state crosses companies. */
export function PortalMessagesView({
  cockpitHref,
  content,
  conversation,
  customerId,
  locale,
  viewerUserId,
}: PortalMessagesViewProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{content.page.heading}</h1>
        <p>{content.page.intro}</p>
      </header>
      <section aria-label={content.thread.logLabel} className={styles.panel}>
        <PortalConversation
          active
          cockpitHref={cockpitHref}
          content={content}
          customerId={customerId}
          initialConversation={conversation}
          locale={locale}
          viewerUserId={viewerUserId}
        />
      </section>
    </div>
  );
}
