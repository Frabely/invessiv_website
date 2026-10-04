import { describe, expect, it } from "vitest";
import { PortalTaskRequestLimits } from "./portal-task-request-limits";

describe("PortalTaskRequestLimits", () => {
  it("keeps the agreed bounds", () => {
    expect(PortalTaskRequestLimits).toEqual({
      OpenPerProject: 20,
      RejectedShown: 5,
      CompletedShown: 5,
      CustomerCompletedShown: 20,
    });
  });
});
