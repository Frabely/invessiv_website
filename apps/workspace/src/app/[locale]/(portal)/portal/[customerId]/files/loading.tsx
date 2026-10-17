import { Skeleton } from "@invessiv/ui";
import styles from "./loading.module.css";

/** Heading, tabs and the first rows in their final places, so nothing jumps on arrival. */
export default function PortalFilesLoading() {
  return (
    <div aria-busy="true" className={styles.frame}>
      <Skeleton className={styles.heading} />
      <Skeleton className={styles.tabs} />
      <Skeleton className={styles.row} />
      <Skeleton className={styles.row} />
      <Skeleton className={styles.row} />
    </div>
  );
}
