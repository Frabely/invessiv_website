import { describe, expect, it } from "vitest";

import {
  BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES,
  BootstrapWorkspaceOwnerError,
  WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES,
  WORKSPACE_AUTH_STATUS_VALUES,
  WorkspaceActorResolutionError,
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
  });

  it("lists every actor resolution error exactly once", () => {
    expect(WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES).toEqual([
      "user_missing",
      "user_inactive",
      "membership_missing",
      "membership_inactive",
    ]);
    expect(WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES).toEqual(
      Object.values(WorkspaceActorResolutionError),
    );
  });

  it("lists every bootstrap error exactly once", () => {
    expect(BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES).toEqual([
      "already_initialized",
      "identity_mismatch",
    ]);
    expect(BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES).toEqual(
      Object.values(BootstrapWorkspaceOwnerError),
    );
  });
});
