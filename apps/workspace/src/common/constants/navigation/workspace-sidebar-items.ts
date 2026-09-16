import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { WorkspaceSidebarItemKey } from "@/common/constants/navigation/workspace-sidebar-item-keys";

type WorkspaceSidebarItem = {
  area: WorkspaceArea;
  id: WorkspaceSidebarItemKey;
  labelKey: WorkspaceSidebarItemKey;
};

export const WORKSPACE_SIDEBAR_ITEMS = [
  {
    area: WorkspaceArea.Dashboard,
    id: WorkspaceSidebarItemKey.Overview,
    labelKey: WorkspaceSidebarItemKey.Overview,
  },
  {
    area: WorkspaceArea.Leads,
    id: WorkspaceSidebarItemKey.Leads,
    labelKey: WorkspaceSidebarItemKey.Leads,
  },
  {
    area: WorkspaceArea.Crm,
    id: WorkspaceSidebarItemKey.Crm,
    labelKey: WorkspaceSidebarItemKey.Crm,
  },
  {
    area: WorkspaceArea.Settings,
    id: WorkspaceSidebarItemKey.Settings,
    labelKey: WorkspaceSidebarItemKey.Settings,
  },
] as const satisfies readonly WorkspaceSidebarItem[];
