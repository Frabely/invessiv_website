import { describe, expect, it } from "vitest";
import {
  PROCESS_STEP_PROGRESS_VALUES,
  ProcessStepProgress,
} from "./process-step-progress";

describe("ProcessStepProgress", () => {
  it("contains the exact values without duplicates", () => {
    expect(PROCESS_STEP_PROGRESS_VALUES).toEqual([
      "empty",
      "partial",
      "complete",
    ]);
    expect([...PROCESS_STEP_PROGRESS_VALUES]).toEqual(
      Object.values(ProcessStepProgress),
    );
  });
});
