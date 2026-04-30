import type { DashboardPageContent } from "@/i18n/dictionaries/dashboard";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  content: DashboardPageContent;
};

export function DashboardShell({ content }: DashboardShellProps) {
  return (
    <section className={styles.shell}>
      <h1 className={styles.headline}>{content.headline}</h1>
      <p className={styles.subCopy}>{content.subCopy}</p>
    </section>
  );
}
