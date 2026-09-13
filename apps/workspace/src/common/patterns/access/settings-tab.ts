import {
  SETTINGS_TAB_QUERY_PARAM,
  SettingsTab,
} from "@/common/constants/access/settings-tabs";

/** Without `roles.manage` a requested roles tab falls back instead of revealing an empty tab. */
export function resolveSettingsTab(
  value: string | string[] | undefined,
  canManageRoles: boolean,
): SettingsTab {
  const requested = Array.isArray(value) ? value[0] : value;
  return requested === SettingsTab.Roles && canManageRoles
    ? SettingsTab.Roles
    : SettingsTab.Members;
}

export function buildSettingsTabHref(
  basePath: string,
  tab: SettingsTab,
): string {
  if (tab === SettingsTab.Members) {
    return basePath;
  }
  const params = new URLSearchParams({ [SETTINGS_TAB_QUERY_PARAM]: tab });
  return `${basePath}?${params.toString()}`;
}
