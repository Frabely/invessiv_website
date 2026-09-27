import { Skeleton } from "@invessiv/ui";
import styles from "./loading.module.css";

/** Heading line and conversation panel in their final places, so nothing jumps on arrival. */
export default function PortalMessagesLoading() {
  return (
    <div aria-busy="true" className={styles.frame}>
      <Skeleton className={styles.heading} />
      <Skeleton className={styles.panel} />
    </div>
  );
}
