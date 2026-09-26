import type { ReactNode } from "react";

import styles from "./section-empty-state.module.css";

type SectionEmptyStateProps = {
  action?: ReactNode;
  description: string;
  title: string;
};

export function SectionEmptyState({
  action,
  description,
  title,
}: SectionEmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
      {action}
    </div>
  );
}
