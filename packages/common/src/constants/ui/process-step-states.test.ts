import { describe, expect, it } from "vitest";
import { ProcessStepState } from "./process-step-states";

describe("ProcessStepState", () => {
  it("contains each unique progress state", () => {
    expect(ProcessStepState).toEqual({
      Complete: "complete",
      Current: "current",
      Upcoming: "upcoming",
    });
    expect(new Set(Object.values(ProcessStepState)).size).toBe(3);
  });
});
