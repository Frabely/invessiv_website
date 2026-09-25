import { describe, expect, it } from "vitest";
import { PortalAccessApiSegment } from "./portal-access-api-segments";

describe("PortalAccessApiSegment", () => {
  it("contains unique route segments", () => {
    expect(PortalAccessApiSegment).toEqual({
      Access: "portal-access",
      Invitations: "portal-invitations",
      Preview: "portal-preview",
      Roles: "roles",
    });
    const values = Object.values(PortalAccessApiSegment);
    expect(new Set(values).size).toBe(values.length);
  });
});
