import type { WidgetLayoutEntry } from "@invessiv/common/contracts/ui/widget-layout";
import { DashboardModuleKey } from "./dashboard-module-keys";

export const DASHBOARD_WIDGET_LAYOUT: readonly WidgetLayoutEntry<DashboardModuleKey>[] =
  [
    {
      key: DashboardModuleKey.DueTasks,
      order: 10,
      span: { mobile: 12, tablet: 12, desktop: 12 },
    },
    {
      key: DashboardModuleKey.Messaging,
      order: 20,
      span: { mobile: 12, tablet: 12, desktop: 12 },
    },
    {
      key: DashboardModuleKey.AcquisitionVolume,
      order: 30,
      span: { mobile: 12, tablet: 6, desktop: 4 },
    },
    {
      key: DashboardModuleKey.HotLeads,
      order: 40,
      span: { mobile: 12, tablet: 6, desktop: 4 },
    },
    {
      key: DashboardModuleKey.TimeToContact,
      order: 50,
      span: { mobile: 12, tablet: 6, desktop: 4 },
    },
    {
      key: DashboardModuleKey.SourcePerformance,
      order: 60,
      span: { mobile: 12, tablet: 12, desktop: 8 },
    },
    {
      key: DashboardModuleKey.OutreachActivity,
      order: 70,
      span: { mobile: 12, tablet: 12, desktop: 8 },
    },
    {
      key: DashboardModuleKey.FunnelVelocity,
      order: 80,
      span: { mobile: 12, tablet: 6, desktop: 6 },
    },
    {
      key: DashboardModuleKey.ActivityHeatmap,
      order: 90,
      span: { mobile: 12, tablet: 6, desktop: 6 },
    },
  ];
