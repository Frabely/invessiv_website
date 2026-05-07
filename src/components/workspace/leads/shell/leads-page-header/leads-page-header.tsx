import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { LeadsShellDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./leads-page-header.module.css";

type LeadsPageHeaderProps = {
  content: LeadsShellDictionary;
  addLeadHref: string;
};

export function LeadsPageHeader({
  addLeadHref,
  content,
}: LeadsPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{content.title}</h1>
          <span className={styles.privacyBadge} title={content.privacyBadge}>
            <span aria-hidden="true" className={styles.privacyBadgeIcon}>
              <FontAwesomeIcon icon={faLock} />
            </span>
            {content.privacyBadge}
          </span>
        </div>
        <p className={styles.description}>{content.description}</p>
      </div>
      <div className={styles.actionsRow}>
        <Link className={styles.addButton} href={addLeadHref} scroll={false}>
          <span aria-hidden="true" className={styles.addButtonIcon}>
            <FontAwesomeIcon icon={faPlus} />
          </span>
          {content.addLeadButton}
        </Link>
      </div>
    </header>
  );
}
