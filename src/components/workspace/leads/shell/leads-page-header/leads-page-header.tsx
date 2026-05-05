import type { LeadsShellDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./leads-page-header.module.css";

type LeadsPageHeaderProps = {
  content: LeadsShellDictionary;
};

export function LeadsPageHeader({ content }: LeadsPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{content.title}</h1>
          <span className={styles.privacyBadge} title={content.privacyBadge}>
            <span aria-hidden="true" className={styles.privacyBadgeIcon}>
              <svg
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            {content.privacyBadge}
          </span>
        </div>
        <p className={styles.description}>{content.description}</p>
      </div>
      <div className={styles.actionsRow}>
        <button
          aria-disabled="true"
          className={styles.addButton}
          disabled
          tabIndex={-1}
          type="button"
        >
          <span aria-hidden="true" className={styles.addButtonIcon}>
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </span>
          {content.addLeadButton}
        </button>
      </div>
    </header>
  );
}
