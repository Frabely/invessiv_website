import styles from "./reference-scope-details.module.css";

type ReferenceScopeDetailsProps = {
  items: string[];
  label: string;
};

export function ReferenceScopeDetails({
  items,
  label,
}: ReferenceScopeDetailsProps) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>{label}</summary>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}
