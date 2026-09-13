import { describe, expect, it } from "vitest";

import {
  WORKSPACE_AUTH_STATUS_VALUES,
  WorkspaceAuthStatus,
} from "@/common/constants/auth/workspace-auth-statuses";

describe("workspace auth constants", () => {
  it("lists every auth status exactly once", () => {
    expect(WORKSPACE_AUTH_STATUS_VALUES).toEqual([
      "authorized",
      "unauthenticated",
      "not_member",
      "unavailable",
    ]);
    expect(WORKSPACE_AUTH_STATUS_VALUES).toEqual(
      Object.values(WorkspaceAuthStatus),
    );
    expect(new Set(WORKSPACE_AUTH_STATUS_VALUES).size).toBe(
      WORKSPACE_AUTH_STATUS_VALUES.length,
    );
  });
});
