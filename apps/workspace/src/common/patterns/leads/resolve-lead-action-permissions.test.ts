import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { resolveLeadActionPermissions } from "@/common/patterns/leads/resolve-lead-action-permissions";

describe("resolveLeadActionPermissions", () => {
  it("grants nothing for a read-only holder", () => {
    expect(
      resolveLeadActionPermissions({
        permissions: new Set([Permission.LeadsRead]),
      }),
    ).toEqual({
      canWrite: false,
      canDelete: false,
      canImport: false,
      canGenerateOutreach: false,
    });
  });

  it("maps each lead permission to exactly its own flag", () => {
    expect(
      resolveLeadActionPermissions({
        permissions: new Set([
          Permission.LeadsWrite,
          Permission.OutreachGenerate,
        ]),
      }),
    ).toEqual({
      canWrite: true,
      canDelete: false,
      canImport: false,
      canGenerateOutreach: true,
    });
  });
});
