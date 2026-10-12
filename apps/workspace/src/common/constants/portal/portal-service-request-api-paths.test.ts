import { describe, expect, it } from "vitest";
import { PortalServiceRequestApiPath } from "./portal-service-request-api-paths";
describe("portal-service-request-api-paths", () => {
  it("contains the exact values without duplicates", () => {
    expect(PortalServiceRequestApiPath).toEqual({
      ServiceRequests: "service-requests",
      Withdraw: "withdraw",
    });
    expect(new Set(Object.values(PortalServiceRequestApiPath)).size).toBe(
      Object.values(PortalServiceRequestApiPath).length,
    );
  });
});
