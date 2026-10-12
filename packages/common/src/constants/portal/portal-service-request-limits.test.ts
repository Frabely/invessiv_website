import { describe, expect, it } from "vitest";
import { HoursLimits } from "../crm/hours-limits";
import { PortalServiceRequestLimits } from "./portal-service-request-limits";

describe("PortalServiceRequestLimits", () => {
  it("keeps the agreed bounds", () => {
    expect(PortalServiceRequestLimits).toEqual({
      OpenPerCustomer: 10,
      MinRequestedMinutes: 60,
      MaxRequestedMinutes: 6000,
      HistoryShown: 20,
    });
  });

  it("stays inside what the hours ledger accepts", () => {
    for (const minutes of [
      PortalServiceRequestLimits.MinRequestedMinutes,
      PortalServiceRequestLimits.MaxRequestedMinutes,
    ]) {
      expect(minutes % HoursLimits.StepMinutes).toBe(0);
      expect(minutes).toBeLessThanOrEqual(HoursLimits.MaxLedgerMinutes);
    }
  });
});
