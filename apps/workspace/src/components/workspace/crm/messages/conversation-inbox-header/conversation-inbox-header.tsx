import type { CrmMessagesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./conversation-inbox-header.module.css";

type ConversationInboxHeaderProps = {
  content: CrmMessagesDictionary["inbox"];
};

export function ConversationInboxHeader({
  content,
}: ConversationInboxHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{content.heading}</h1>
      <p className={styles.description}>{content.intro}</p>
    </header>
  );
}
