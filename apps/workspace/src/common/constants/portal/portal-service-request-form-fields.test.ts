import { describe, expect, it } from "vitest";
import {
  PortalServiceRequestFormField,
  PORTAL_SERVICE_REQUEST_QUICK_HOURS,
} from "./portal-service-request-form-fields";
describe("portal-service-request-form-fields", () => {
  it("contains the exact values without duplicates", () => {
    expect(PortalServiceRequestFormField).toEqual({
      Title: "title",
      Note: "note",
      Hours: "hours",
      Project: "project",
    });
    expect(new Set(Object.values(PortalServiceRequestFormField)).size).toBe(
      Object.values(PortalServiceRequestFormField).length,
    );
    expect(PORTAL_SERVICE_REQUEST_QUICK_HOURS).toEqual([5, 10, 20]);
    expect(new Set(PORTAL_SERVICE_REQUEST_QUICK_HOURS).size).toBe(
      PORTAL_SERVICE_REQUEST_QUICK_HOURS.length,
    );
  });
});
