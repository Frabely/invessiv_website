import { Skeleton } from "@invessiv/ui";
import styles from "./loading.module.css";

/** Heading, round intro and the first points in their final places, so nothing jumps on arrival. */
export default function PortalFeedbackLoading() {
  return (
    <div aria-busy="true" className={styles.frame}>
      <Skeleton className={styles.heading} />
      <Skeleton className={styles.intro} />
      <Skeleton className={styles.item} />
      <Skeleton className={styles.item} />
    </div>
  );
}
