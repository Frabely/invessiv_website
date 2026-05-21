import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import type { DashboardHeaderDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import styles from "./dashboard-page-header.module.css";

type DashboardPageHeaderProps = {
  content: DashboardHeaderDictionary;
  rangeFilter?: ReactNode;
};

export function DashboardPageHeader({
  content,
  rangeFilter,
}: DashboardPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.intro}>
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
      {rangeFilter ? (
        <div className={styles.filterSlot}>{rangeFilter}</div>
      ) : null}
    </header>
  );
}
