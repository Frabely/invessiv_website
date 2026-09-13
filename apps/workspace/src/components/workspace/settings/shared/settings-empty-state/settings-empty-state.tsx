import type { ReactNode } from "react";

import styles from "./settings-empty-state.module.css";

type SettingsEmptyStateProps = {
  action?: ReactNode;
  description: string;
  title: string;
};

export function SettingsEmptyState({
  action,
  description,
  title,
}: SettingsEmptyStateProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
