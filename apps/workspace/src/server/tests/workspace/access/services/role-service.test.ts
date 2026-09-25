import { describe, expect, it, vi } from "vitest";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SYSTEM_ROLE_KEY_VALUES } from "@invessiv/common/constants/auth/system-role-keys";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { roleService } from "@/server/workspace/access/services/role-service";

vi.mock("server-only", () => ({}));

describe("roleService.isReservedName", () => {
  it("reserves every translated system role label regardless of case and spacing", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const systemKey of SYSTEM_ROLE_KEY_VALUES) {
        const label =
          getSettingsPermissionsDictionary(locale).systemRoles[systemKey].label;

        expect(roleService.isReservedName(label)).toBe(true);
        expect(roleService.isReservedName(`  ${label.toUpperCase()} `)).toBe(
          true,
        );
      }
    }
  });

  it("reserves the database names of the system roles", () => {
    for (const systemKey of SYSTEM_ROLE_KEY_VALUES) {
      expect(
        roleService.isReservedName(
          SYSTEM_ROLE_DEFINITIONS[systemKey].name.replace(" ", "   "),
        ),
      ).toBe(true);
    }
  });

  it("allows ordinary custom names, including ones that only contain a system label", () => {
    expect(roleService.isReservedName("Vertrieb")).toBe(false);
    expect(roleService.isReservedName("Owner-Assistenz")).toBe(false);
  });
});
