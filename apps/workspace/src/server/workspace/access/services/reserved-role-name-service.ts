import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SYSTEM_ROLE_KEY_VALUES } from "@invessiv/common/constants/auth/system-role-keys";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";

function normalizeRoleName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// The UI shows system roles by their translated label and the database keeps a developer name;
// a custom role must match neither, in any supported locale.
const RESERVED_ROLE_NAMES = new Set(
  SYSTEM_ROLE_KEY_VALUES.flatMap((systemKey) => [
    SYSTEM_ROLE_DEFINITIONS[systemKey].name,
    ...SUPPORTED_LOCALES.map(
      (locale) =>
        getSettingsPermissionsDictionary(locale).systemRoles[systemKey].label,
    ),
  ]).map(normalizeRoleName),
);

function isReserved(name: string): boolean {
  return RESERVED_ROLE_NAMES.has(normalizeRoleName(name));
}

export const reservedRoleNameService = {
  isReserved,
} as const;
