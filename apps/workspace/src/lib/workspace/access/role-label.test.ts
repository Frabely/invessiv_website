import { describe, expect, it } from "vitest";

import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import {
  resolveRoleDescription,
  resolveRoleLabel,
} from "@/lib/workspace/access/role-label";

const content = getSettingsPermissionsDictionary("de");

describe("role labels", () => {
  it("translates system roles and keeps custom names", () => {
    expect(
      resolveRoleLabel(
        { name: "Workspace owner", systemKey: SystemRoleKey.WorkspaceOwner },
        content,
      ),
    ).toBe("Owner");
    expect(
      resolveRoleLabel({ name: "Vertrieb", systemKey: null }, content),
    ).toBe("Vertrieb");
    expect(
      resolveRoleDescription({ description: null, systemKey: null }, content),
    ).toBeNull();
  });
});

describe("formatMessage", () => {
  it("fills known placeholders and leaves unknown ones visible", () => {
    expect(formatMessage("{count} von {total}", { count: 2 })).toBe(
      "2 von {total}",
    );
  });
});
