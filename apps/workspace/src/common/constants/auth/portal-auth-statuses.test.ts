import { describe, expect, it } from "vitest";

import {
  PORTAL_AUTH_STATUS_VALUES,
  PortalAuthStatus,
} from "@/common/constants/auth/portal-auth-statuses";

describe("PortalAuthStatus", () => {
  it("contains the exact values without duplicates", () => {
    expect(PORTAL_AUTH_STATUS_VALUES).toEqual([
      "authorized",
      "unauthenticated",
      "not_member",
      "unavailable",
    ]);
    expect(PORTAL_AUTH_STATUS_VALUES).toEqual(Object.values(PortalAuthStatus));
    expect(new Set(PORTAL_AUTH_STATUS_VALUES).size).toBe(
      PORTAL_AUTH_STATUS_VALUES.length,
    );
  });

  it("has no separate inactive status: a revoked membership is not_member, like an unknown one", () => {
    expect(Object.values(PortalAuthStatus)).not.toContain("inactive");
  });
});
