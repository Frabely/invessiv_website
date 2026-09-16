import { Permission } from "@invessiv/common/constants/auth/permissions";

export const WorkspaceArea = {
  Dashboard: "dashboard",
  Leads: "leads",
  Crm: "crm",
  Settings: "settings",
} as const;

export type WorkspaceArea = (typeof WorkspaceArea)[keyof typeof WorkspaceArea];

/** Order is the landing priority of the workspace start page. */
export const WORKSPACE_AREA_VALUES = [
  WorkspaceArea.Dashboard,
  WorkspaceArea.Leads,
  WorkspaceArea.Crm,
  WorkspaceArea.Settings,
] as const;

/**
 * The only mapping between areas and permissions. An area never knows which role grants
 * its permission — navigation, area layouts and the start page read exclusively this map.
 */
export const WORKSPACE_AREA_PERMISSIONS = {
  [WorkspaceArea.Dashboard]: Permission.DashboardRead,
  [WorkspaceArea.Leads]: Permission.LeadsRead,
  [WorkspaceArea.Crm]: Permission.CustomersRead,
  [WorkspaceArea.Settings]: Permission.MembersManage,
} as const satisfies Record<WorkspaceArea, Permission>;
