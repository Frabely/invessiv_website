import { Skeleton } from "@invessiv/ui";
import styles from "./loading.module.css";

/** Heading, upload area and list in their final places, so nothing jumps on arrival. */
export default function PortalFilesLoading() {
  return (
    <div aria-busy="true" className={styles.frame}>
      <Skeleton className={styles.heading} />
      <Skeleton className={styles.intake} />
      <Skeleton className={styles.panel} />
    </div>
  );
}
