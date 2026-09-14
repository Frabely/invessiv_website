import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { WorkspaceSidebarItemKey } from "@/common/constants/navigation/workspace-sidebar-item-keys";

export type WorkspaceSidebarItem = {
  area: WorkspaceArea;
  iconPaths: ReadonlyArray<string>;
  iconViewBox: string;
  id: WorkspaceSidebarItemKey;
  labelKey: WorkspaceSidebarItemKey;
};

export const WORKSPACE_SIDEBAR_ITEMS: ReadonlyArray<WorkspaceSidebarItem> = [
  {
    area: WorkspaceArea.Dashboard,
    id: WorkspaceSidebarItemKey.Overview,
    labelKey: WorkspaceSidebarItemKey.Overview,
    iconViewBox: "0 0 24 24",
    iconPaths: [
      "M3 3h7v9H3z",
      "M14 3h7v5h-7z",
      "M14 12h7v9h-7z",
      "M3 16h7v5H3z",
    ],
  },
  {
    area: WorkspaceArea.Leads,
    id: WorkspaceSidebarItemKey.Leads,
    labelKey: WorkspaceSidebarItemKey.Leads,
    iconViewBox: "0 0 24 24",
    iconPaths: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      "M22 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
  {
    area: WorkspaceArea.Settings,
    id: WorkspaceSidebarItemKey.Settings,
    labelKey: WorkspaceSidebarItemKey.Settings,
    iconViewBox: "0 0 24 24",
    iconPaths: [
      "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    ],
  },
];
