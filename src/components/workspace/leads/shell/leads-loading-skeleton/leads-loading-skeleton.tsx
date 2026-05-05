import styles from "./leads-loading-skeleton.module.css";

export function LeadsLoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={styles.shell}
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

      <div className={styles.tableSkeleton}>
        <div className={styles.tableHeader}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div className={`${styles.bone} ${styles.colBone}`} key={i} />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div className={styles.tableRow} key={row}>
            <div className={`${styles.bone} ${styles.cellLead}`} />
            <div className={`${styles.bone} ${styles.cellMed}`} />
            <div className={`${styles.bone} ${styles.cellSm}`} />
            <div className={`${styles.bone} ${styles.cellSm}`} />
            <div className={`${styles.bone} ${styles.cellMed}`} />
            <div className={`${styles.bone} ${styles.cellSm}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
