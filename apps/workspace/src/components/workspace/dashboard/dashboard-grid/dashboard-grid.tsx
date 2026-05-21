import type { ReactNode } from "react";
import styles from "./dashboard-grid.module.css";

const DashboardModuleKey = {
  AcquisitionVolume: "acquisitionVolume",
  Funnel: "funnel",
  SourcePerformance: "sourcePerformance",
  TimeToContact: "timeToContact",
  OutreachActivity: "outreachActivity",
  HotLeads: "hotLeads",
  FunnelVelocity: "funnelVelocity",
  ActivityHeatmap: "activityHeatmap",
} as const;

type DashboardModuleKey =
  (typeof DashboardModuleKey)[keyof typeof DashboardModuleKey];

type ColumnSpan = 4 | 6 | 8 | 12;

type ResponsiveSpan = {
  mobile: ColumnSpan;
  tablet: ColumnSpan;
  desktop: ColumnSpan;
};

type ModuleLayout = {
  key: DashboardModuleKey;
  span: ResponsiveSpan;
};

const MODULE_LAYOUT: ReadonlyArray<ModuleLayout> = [
  {
    key: DashboardModuleKey.Funnel,
    span: { mobile: 12, tablet: 12, desktop: 12 },
  },
  {
    key: DashboardModuleKey.AcquisitionVolume,
    span: { mobile: 12, tablet: 6, desktop: 4 },
  },
  {
    key: DashboardModuleKey.HotLeads,
    span: { mobile: 12, tablet: 6, desktop: 4 },
  },
  {
    key: DashboardModuleKey.TimeToContact,
    span: { mobile: 12, tablet: 6, desktop: 4 },
  },
  {
    key: DashboardModuleKey.SourcePerformance,
    span: { mobile: 12, tablet: 12, desktop: 8 },
  },
  {
    key: DashboardModuleKey.OutreachActivity,
    span: { mobile: 12, tablet: 12, desktop: 8 },
  },
  {
    key: DashboardModuleKey.FunnelVelocity,
    span: { mobile: 12, tablet: 6, desktop: 6 },
  },
  {
    key: DashboardModuleKey.ActivityHeatmap,
    span: { mobile: 12, tablet: 6, desktop: 6 },
  },
];

type DashboardGridSlots = Partial<Record<DashboardModuleKey, ReactNode>>;

type DashboardGridProps = {
  slots?: DashboardGridSlots;
};

export function DashboardGrid({ slots }: DashboardGridProps) {
  return (
    <section className={styles.grid}>
      {MODULE_LAYOUT.map(({ key, span }) => {
        const slot = slots?.[key];
        if (!slot) {
          return null;
        }
        return (
          <div
            className={styles.slot}
            data-desktop-span={span.desktop}
            data-mobile-span={span.mobile}
            data-tablet-span={span.tablet}
            data-widget={key}
            key={key}
          >
            {slot}
          </div>
        );
      })}
    </section>
  );
}
