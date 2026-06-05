import { describe, expect, it } from "vitest";

import { LeadDeliverStatus } from "@/common/constants";

describe("LeadDeliverStatus", () => {
  it("exposes the exact delivery status values", () => {
    expect(LeadDeliverStatus).toEqual({
      Idle: "idle",
      Sending: "sending",
      Success: "success",
      Error: "error",
    });
  });

  it("has no duplicate values", () => {
    const values = Object.values(LeadDeliverStatus);
    expect(new Set(values).size).toBe(values.length);
  });
});
