import { Skeleton } from "@invessiv/ui";
import styles from "./customers-loading-skeleton.module.css";

const PLACEHOLDER_ROWS = 6;

export function CustomersLoadingSkeleton() {
  return (
    <div aria-busy="true" className={styles.shell}>
      <div className={styles.header}>
        <Skeleton className={styles.title} />
        <Skeleton className={styles.line} />
      </div>
      <div className={styles.frame}>
        {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
          <div className={styles.row} key={index}>
            <Skeleton className={styles.number} />
            <Skeleton className={styles.name} />
            <Skeleton className={styles.badge} />
          </div>
        ))}
      </div>
    </div>
  );
}
