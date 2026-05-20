import styles from "./leads-table-loading-state.module.css";

type LeadsTableLoadingStateProps = {
  rowCount?: number;
};

export function LeadsTableLoadingState({
  rowCount = 6,
}: LeadsTableLoadingStateProps) {
  return (
    <div aria-busy="true" className={styles.shell} role="status">
      <div className={styles.tableSkeleton}>
        <div className={styles.tableHeader}>
          <div className={`${styles.bone} ${styles.colCheckbox}`} />
          <div className={`${styles.bone} ${styles.colLead}`} />
          <div className={`${styles.bone} ${styles.colCategory}`} />
          <div className={`${styles.bone} ${styles.colStage}`} />
          <div className={`${styles.bone} ${styles.colSource}`} />
          <div className={`${styles.bone} ${styles.colOwner}`} />
          <div className={`${styles.bone} ${styles.colScore}`} />
          <div className={`${styles.bone} ${styles.colCreated}`} />
          <div className={`${styles.bone} ${styles.colNextStep}`} />
        </div>

        {Array.from({ length: rowCount }, (_, index) => (
          <div className={styles.tableRow} key={index}>
            <div className={`${styles.bone} ${styles.cellCheckbox}`} />

            <div className={styles.leadCell}>
              <div className={`${styles.bone} ${styles.avatarBone}`} />
              <div className={styles.leadTextBlock}>
                <div className={`${styles.bone} ${styles.leadTitleBone}`} />
                <div className={`${styles.bone} ${styles.leadMailBone}`} />
                <div className={`${styles.bone} ${styles.leadUrlBone}`} />
              </div>
            </div>

            <div className={`${styles.bone} ${styles.cellCategory}`} />
            <div className={`${styles.bone} ${styles.cellStageBadge}`} />
            <div className={`${styles.bone} ${styles.cellSourceBadge}`} />
            <div className={`${styles.bone} ${styles.cellOwner}`} />

            <div className={styles.scoreBone}>
              <div className={styles.scoreDots} />
              <div className={`${styles.bone} ${styles.scoreValueBone}`} />
            </div>

            <div className={`${styles.bone} ${styles.cellCreated}`} />
            <div className={`${styles.bone} ${styles.cellNextStep}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
