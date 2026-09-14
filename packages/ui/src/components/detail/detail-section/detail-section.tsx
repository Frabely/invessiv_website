import type { ReactNode } from "react";
import styles from "./detail-section.module.css";

export type DetailSectionProps = {
  actions?: ReactNode;
  children: ReactNode;
  id: string;
  title: string;
};

export function DetailSection({
  actions,
  children,
  id,
  title,
}: DetailSectionProps) {
  return (
    <section aria-labelledby={id} className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title} id={id}>
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </section>
  );
}
