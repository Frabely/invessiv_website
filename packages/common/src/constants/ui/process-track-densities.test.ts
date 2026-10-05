import { describe, expect, it } from "vitest";
import {
  PROCESS_TRACK_DENSITY_VALUES,
  ProcessTrackDensity,
} from "./process-track-densities";

describe("ProcessTrackDensity", () => {
  it("contains the exact values without duplicates", () => {
    expect(PROCESS_TRACK_DENSITY_VALUES).toEqual(["default", "compact"]);
    expect([...PROCESS_TRACK_DENSITY_VALUES]).toEqual(
      Object.values(ProcessTrackDensity),
    );
  });
});
