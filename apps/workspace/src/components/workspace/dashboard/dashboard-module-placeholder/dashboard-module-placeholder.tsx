import styles from "./dashboard-module-placeholder.module.css";

type DashboardModulePlaceholderProps = {
  badgeLabel: string;
  description: string;
  title: string;
};

export function DashboardModulePlaceholder({
  badgeLabel,
  description,
  title,
}: DashboardModulePlaceholderProps) {
  return (
    <article aria-busy="true" className={styles.card}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.badge}>{badgeLabel}</span>
      </div>
      <p className={styles.description}>{description}</p>
      <div aria-hidden="true" className={styles.preview}>
        <span className={styles.previewBar} />
        <span className={styles.previewBar} />
        <span className={styles.previewBar} />
      </div>
    </article>
  );
}
