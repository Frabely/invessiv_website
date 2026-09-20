import type { Locale } from "@/config/i18n";
import membersDe from "./members/de.json";
import membersEn from "./members/en.json";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import permissionsDe from "./permissions/de.json";
import permissionsEn from "./permissions/en.json";
import rolesDe from "./roles/de.json";
import rolesEn from "./roles/en.json";
import shellDe from "./shell/de.json";
import shellEn from "./shell/en.json";
import accessDe from "./access/de.json";
import accessEn from "./access/en.json";

export type SettingsMetaDictionary = typeof metaDe;
export type SettingsShellDictionary = typeof shellDe;
export type SettingsMembersDictionary = typeof membersDe;
export type SettingsRolesDictionary = typeof rolesDe;
export type SettingsPermissionsDictionary = typeof permissionsDe;
export type SettingsAccessDictionary = typeof accessDe;

const SETTINGS_META: Record<Locale, SettingsMetaDictionary> = {
  de: metaDe,
  en: metaEn,
};

const SETTINGS_SHELL: Record<Locale, SettingsShellDictionary> = {
  de: shellDe,
  en: shellEn,
};

const SETTINGS_MEMBERS: Record<Locale, SettingsMembersDictionary> = {
  de: membersDe,
  en: membersEn,
};

const SETTINGS_ROLES: Record<Locale, SettingsRolesDictionary> = {
  de: rolesDe,
  en: rolesEn,
};

const SETTINGS_PERMISSIONS: Record<Locale, SettingsPermissionsDictionary> = {
  de: permissionsDe,
  en: permissionsEn,
};

const SETTINGS_ACCESS: Record<Locale, SettingsAccessDictionary> = {
  de: accessDe,
  en: accessEn,
};

export function getSettingsMetaDictionary(
  locale: Locale,
): SettingsMetaDictionary {
  return SETTINGS_META[locale];
}

export function getSettingsShellDictionary(
  locale: Locale,
): SettingsShellDictionary {
  return SETTINGS_SHELL[locale];
}

export function getSettingsMembersDictionary(
  locale: Locale,
): SettingsMembersDictionary {
  return SETTINGS_MEMBERS[locale];
}

export function getSettingsRolesDictionary(
  locale: Locale,
): SettingsRolesDictionary {
  return SETTINGS_ROLES[locale];
}

export function getSettingsPermissionsDictionary(
  locale: Locale,
): SettingsPermissionsDictionary {
  return SETTINGS_PERMISSIONS[locale];
}

export function getSettingsAccessDictionary(
  locale: Locale,
): SettingsAccessDictionary {
  return SETTINGS_ACCESS[locale];
}
