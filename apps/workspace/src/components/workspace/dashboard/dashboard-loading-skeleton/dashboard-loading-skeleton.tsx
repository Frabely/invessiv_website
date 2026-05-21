import styles from "./dashboard-loading-skeleton.module.css";

type CellSpan = "span12" | "span6" | "span4";

const PLACEHOLDER_LAYOUT: ReadonlyArray<{ id: string; span: CellSpan }> = [
  { id: "acquisitionVolume", span: "span4" },
  { id: "funnel", span: "span12" },
  { id: "sourcePerformance", span: "span6" },
  { id: "timeToContact", span: "span4" },
  { id: "outreachActivity", span: "span6" },
  { id: "hotLeads", span: "span6" },
  { id: "funnelVelocity", span: "span4" },
  { id: "activityHeatmap", span: "span4" },
];

export function DashboardLoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={styles.shell}
      data-workspace-page="dashboard"
      role="status"
    >
      <div className={styles.headerSkeleton}>
        <div className={styles.intro}>
          <div className={`${styles.bone} ${styles.titleBone}`} />
          <div className={`${styles.bone} ${styles.descBone}`} />
        </div>
        <div className={`${styles.bone} ${styles.filterBone}`} />
      </div>
      <div className={styles.grid}>
        {PLACEHOLDER_LAYOUT.map(({ id, span }) => (
          <div className={`${styles.cell} ${styles[span]}`} key={id}>
            <div className={`${styles.bone} ${styles.cardBone}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
