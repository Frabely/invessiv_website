import styles from "./list-page-header.module.css";

export type ListPageHeaderProps = {
  description: string;
  title: string;
};

/** Title and purpose of a CRM list page; carries the only h1 of the page. */
export function ListPageHeader({ description, title }: ListPageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
    </header>
  );
}
