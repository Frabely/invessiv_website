import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./tasks-overview-header.module.css";

type TasksOverviewHeaderProps = {
  content: CrmTasksDictionary;
};

export function TasksOverviewHeader({ content }: TasksOverviewHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{content.overview.shell.title}</h1>
      <p className={styles.description}>{content.overview.shell.description}</p>
    </header>
  );
}
