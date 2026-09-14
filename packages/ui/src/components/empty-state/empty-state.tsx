import type { ReactNode } from "react";
import styles from "./empty-state.module.css";

export type EmptyStateProps = {
  action?: ReactNode;
  alignment?: "start" | "center";
  description: string;
  icon: ReactNode;
  title: string;
  variant?: "default" | "filtered";
};

export function EmptyState({
  action,
  alignment = "center",
  description,
  icon,
  title,
  variant = "default",
}: EmptyStateProps) {
  return (
    <section className={styles.shell} data-alignment={alignment}>
      <div className={styles.panel} data-variant={variant}>
        <div aria-hidden="true" className={styles.iconFrame}>
          {icon}
        </div>
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
          {action ? <div className={styles.actions}>{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
