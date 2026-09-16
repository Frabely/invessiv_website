/** Sidebar entries; each key is also the label key in the page dictionary. */
export const WorkspaceSidebarItemKey = {
  Overview: "overview",
  Leads: "leads",
  Crm: "crm",
  Settings: "settings",
} as const;

export type WorkspaceSidebarItemKey =
  (typeof WorkspaceSidebarItemKey)[keyof typeof WorkspaceSidebarItemKey];

export const WORKSPACE_SIDEBAR_ITEM_KEY_VALUES = [
  WorkspaceSidebarItemKey.Overview,
  WorkspaceSidebarItemKey.Leads,
  WorkspaceSidebarItemKey.Crm,
  WorkspaceSidebarItemKey.Settings,
] as const;
