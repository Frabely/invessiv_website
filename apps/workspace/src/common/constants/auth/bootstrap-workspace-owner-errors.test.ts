import { describe, expect, it } from "vitest";

import {
  BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES,
  BootstrapWorkspaceOwnerError,
} from "@/common/constants/auth/bootstrap-workspace-owner-errors";

describe("BootstrapWorkspaceOwnerError", () => {
  it("contains the exact values without duplicates", () => {
    expect(BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES).toEqual([
      "already_initialized",
      "identity_mismatch",
    ]);
    expect(BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES).toEqual(
      Object.values(BootstrapWorkspaceOwnerError),
    );
    expect(new Set(BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES).size).toBe(
      BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES.length,
    );
  });
});
