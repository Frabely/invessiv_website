import { describe, expect, it } from "vitest";

import {
  WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES,
  WorkspaceActorResolutionError,
} from "@/common/constants/auth/workspace-actor-resolution-errors";

describe("WorkspaceActorResolutionError", () => {
  it("contains the exact values without duplicates", () => {
    expect(WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES).toEqual([
      "user_missing",
      "user_inactive",
      "membership_missing",
      "membership_inactive",
    ]);
    expect(WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES).toEqual(
      Object.values(WorkspaceActorResolutionError),
    );
    expect(new Set(WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES).size).toBe(
      WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES.length,
    );
  });
});
