export const DashboardModuleKey = {
  DueTasks: "dueTasks",
  AcquisitionVolume: "acquisitionVolume",
  Messaging: "messaging",
  SourcePerformance: "sourcePerformance",
  TimeToContact: "timeToContact",
  OutreachActivity: "outreachActivity",
  HotLeads: "hotLeads",
  FunnelVelocity: "funnelVelocity",
  ActivityHeatmap: "activityHeatmap",
} as const;

export type DashboardModuleKey =
  (typeof DashboardModuleKey)[keyof typeof DashboardModuleKey];
