import type { ReactNode } from "react";
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
      <h1 className="sr-only">{content.title}</h1>
      {rangeFilter ? (
        <div className={styles.filterSlot}>{rangeFilter}</div>
      ) : null}
    </header>
  );
}
