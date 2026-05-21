import type { ReactNode } from "react";
import { DashboardModulePlaceholder } from "@/components/workspace/dashboard/dashboard-module-placeholder/dashboard-module-placeholder";
import type { DashboardModulesDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import styles from "./dashboard-grid.module.css";

type DashboardModuleKey = keyof DashboardModulesDictionary["items"];

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

// Per-widget responsive sizing — each widget declares the column span it needs
// at each breakpoint based on its intrinsic content, not a one-size template.
const MODULE_LAYOUT: ReadonlyArray<ModuleLayout> = [
  {
    key: "funnel",
    span: { mobile: 12, tablet: 12, desktop: 12 },
  },
  {
    key: "acquisitionVolume",
    span: { mobile: 12, tablet: 6, desktop: 4 },
  },
  {
    key: "hotLeads",
    span: { mobile: 12, tablet: 6, desktop: 4 },
  },
  {
    key: "timeToContact",
    span: { mobile: 12, tablet: 6, desktop: 4 },
  },
  {
    key: "sourcePerformance",
    span: { mobile: 12, tablet: 12, desktop: 8 },
  },
  {
    key: "outreachActivity",
    span: { mobile: 12, tablet: 12, desktop: 8 },
  },
  {
    key: "funnelVelocity",
    span: { mobile: 12, tablet: 6, desktop: 6 },
  },
  {
    key: "activityHeatmap",
    span: { mobile: 12, tablet: 6, desktop: 6 },
  },
];

type DashboardGridSlots = Partial<Record<DashboardModuleKey, ReactNode>>;

type DashboardGridProps = {
  content: DashboardModulesDictionary;
  slots?: DashboardGridSlots;
};

export function DashboardGrid({ content, slots }: DashboardGridProps) {
  return (
    <section className={styles.grid}>
      {MODULE_LAYOUT.map(({ key, span }) => {
        const item = content.items[key];
        const slot = slots?.[key];
        return (
          <div
            className={styles.slot}
            data-desktop-span={span.desktop}
            data-mobile-span={span.mobile}
            data-tablet-span={span.tablet}
            data-widget={key}
            key={key}
          >
            {slot ?? (
              <DashboardModulePlaceholder
                badgeLabel={content.placeholderLabel}
                description={item.description}
                title={item.title}
              />
            )}
          </div>
        );
      })}
    </section>
  );
}
