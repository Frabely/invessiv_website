export const SettingsTab = {
  Members: "members",
  Roles: "roles",
} as const;

export type SettingsTab = (typeof SettingsTab)[keyof typeof SettingsTab];

export const SETTINGS_TAB_VALUES = [
  SettingsTab.Members,
  SettingsTab.Roles,
] as const;

export const SETTINGS_TAB_QUERY_PARAM = "tab";
