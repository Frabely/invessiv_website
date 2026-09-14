import { describe, expect, it } from "vitest";

import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SYSTEM_ROLE_KEY_VALUES } from "@invessiv/common/constants/auth/system-role-keys";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { reservedRoleNameService } from "@/server/workspace/access/services/reserved-role-name-service";

describe("reservedRoleNameService.isReserved", () => {
  it("reserves every translated system role label regardless of case and spacing", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const systemKey of SYSTEM_ROLE_KEY_VALUES) {
        const label =
          getSettingsPermissionsDictionary(locale).systemRoles[systemKey].label;

        expect(reservedRoleNameService.isReserved(label)).toBe(true);
        expect(
          reservedRoleNameService.isReserved(`  ${label.toUpperCase()} `),
        ).toBe(true);
      }
    }
  });

  it("reserves the database names of the system roles", () => {
    for (const systemKey of SYSTEM_ROLE_KEY_VALUES) {
      expect(
        reservedRoleNameService.isReserved(
          SYSTEM_ROLE_DEFINITIONS[systemKey].name.replace(" ", "   "),
        ),
      ).toBe(true);
    }
  });

  it("allows ordinary custom names, including ones that only contain a system label", () => {
    expect(reservedRoleNameService.isReserved("Vertrieb")).toBe(false);
    expect(reservedRoleNameService.isReserved("Owner-Assistenz")).toBe(false);
  });
});
