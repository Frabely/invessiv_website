type WorkspaceSidebarItemKey = "leads" | "overview";

export type WorkspaceSidebarItem = {
  iconPaths: ReadonlyArray<string>;
  iconViewBox: string;
  id: WorkspaceSidebarItemKey;
  labelKey: WorkspaceSidebarItemKey;
};

export const WORKSPACE_SIDEBAR_ITEMS: ReadonlyArray<WorkspaceSidebarItem> = [
  {
    id: "leads",
    labelKey: "leads",
    iconViewBox: "0 0 24 24",
    iconPaths: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      "M22 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
  {
    id: "overview",
    labelKey: "overview",
    iconViewBox: "0 0 24 24",
    iconPaths: [
      "M3 3h7v9H3z",
      "M14 3h7v5h-7z",
      "M14 12h7v9h-7z",
      "M3 16h7v5H3z",
    ],
  },
];
