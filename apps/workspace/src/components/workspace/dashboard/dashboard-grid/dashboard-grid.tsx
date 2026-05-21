import type { ReactNode } from "react";
import { DashboardModulePlaceholder } from "@/components/workspace/dashboard/dashboard-module-placeholder/dashboard-module-placeholder";
import type { DashboardModulesDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import styles from "./dashboard-grid.module.css";

type DashboardModuleKey = keyof DashboardModulesDictionary["items"];

type ModuleLayout = {
  key: DashboardModuleKey;
  span: "span12" | "span6" | "span4";
};

const MODULE_LAYOUT: ReadonlyArray<ModuleLayout> = [
  { key: "acquisitionVolume", span: "span4" },
  { key: "funnel", span: "span12" },
  { key: "sourcePerformance", span: "span6" },
  { key: "timeToContact", span: "span4" },
  { key: "outreachActivity", span: "span6" },
  { key: "hotLeads", span: "span6" },
  { key: "funnelVelocity", span: "span4" },
  { key: "activityHeatmap", span: "span4" },
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
          <div className={styles[span]} key={key}>
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
