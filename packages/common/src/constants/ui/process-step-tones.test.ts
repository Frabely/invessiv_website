import { describe, expect, it } from "vitest";
import {
  PROCESS_STEP_TONE_VALUES,
  ProcessStepTone,
} from "./process-step-tones";

describe("ProcessStepTone", () => {
  it("contains the exact values without duplicates", () => {
    expect(PROCESS_STEP_TONE_VALUES).toEqual([
      "neutral",
      "info",
      "success",
      "danger",
    ]);
    expect([...PROCESS_STEP_TONE_VALUES]).toEqual(
      Object.values(ProcessStepTone),
    );
  });
});
