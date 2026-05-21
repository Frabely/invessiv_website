import { LeadsTableLoadingState } from "@/components/workspace/leads/table/leads-table-loading-state/leads-table-loading-state";
import styles from "./leads-loading-skeleton.module.css";

export function LeadsLoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={styles.shell}
      data-workspace-page="leads"
      role="status"
    >
      <div className={styles.headerSkeleton}>
        <div className={styles.titleRow}>
          <div className={`${styles.bone} ${styles.titleBone}`} />
          <div className={`${styles.bone} ${styles.badgeBone}`} />
        </div>
        <div className={`${styles.bone} ${styles.descBone}`} />
        <div className={`${styles.bone} ${styles.btnBone}`} />
      </div>

      <div className={styles.toolbarSkeleton}>
        <div className={styles.tabRow}>
          {[0, 1, 2, 3].map((i) => (
            <div className={`${styles.bone} ${styles.tabBone}`} key={i} />
          ))}
        </div>
        <div className={`${styles.bone} ${styles.searchBone}`} />
      </div>

      <LeadsTableLoadingState />
    </div>
  );
}
