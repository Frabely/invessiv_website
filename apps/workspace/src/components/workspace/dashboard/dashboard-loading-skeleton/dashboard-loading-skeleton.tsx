import styles from "./dashboard-loading-skeleton.module.css";

type ColumnSpan = 4 | 6 | 8 | 12;

type ResponsiveSpan = {
  mobile: ColumnSpan;
  tablet: ColumnSpan;
  desktop: ColumnSpan;
};

const PLACEHOLDER_LAYOUT: ReadonlyArray<{
  id: string;
  span: ResponsiveSpan;
  bone?: "tall" | "default";
}> = [
  { id: "funnel", span: { mobile: 12, tablet: 12, desktop: 12 }, bone: "tall" },
  { id: "acquisitionVolume", span: { mobile: 12, tablet: 6, desktop: 4 } },
  { id: "hotLeads", span: { mobile: 12, tablet: 6, desktop: 4 } },
  { id: "timeToContact", span: { mobile: 12, tablet: 6, desktop: 4 } },
  { id: "sourcePerformance", span: { mobile: 12, tablet: 12, desktop: 8 } },
  { id: "outreachActivity", span: { mobile: 12, tablet: 12, desktop: 8 } },
  { id: "funnelVelocity", span: { mobile: 12, tablet: 6, desktop: 6 } },
  { id: "activityHeatmap", span: { mobile: 12, tablet: 6, desktop: 6 } },
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
        {PLACEHOLDER_LAYOUT.map(({ id, span, bone }) => (
          <div
            className={styles.cell}
            data-desktop-span={span.desktop}
            data-mobile-span={span.mobile}
            data-tablet-span={span.tablet}
            key={id}
          >
            <div
              className={`${styles.bone} ${styles.cardBone}`}
              data-variant={bone ?? "default"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
