import { describe, expect, it } from "vitest";

import {
  PORTAL_ACTOR_RESOLUTION_ERROR_VALUES,
  PortalActorResolutionError,
} from "@/common/constants/auth/portal-actor-resolution-errors";

describe("PortalActorResolutionError", () => {
  it("contains the exact values without duplicates", () => {
    expect(PORTAL_ACTOR_RESOLUTION_ERROR_VALUES).toEqual([
      "user_missing",
      "user_inactive",
      "membership_missing",
      "access_denied",
    ]);
    expect(PORTAL_ACTOR_RESOLUTION_ERROR_VALUES).toEqual(
      Object.values(PortalActorResolutionError),
    );
    expect(new Set(PORTAL_ACTOR_RESOLUTION_ERROR_VALUES).size).toBe(
      PORTAL_ACTOR_RESOLUTION_ERROR_VALUES.length,
    );
  });
});
