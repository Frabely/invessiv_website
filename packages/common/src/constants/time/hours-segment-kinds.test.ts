import { describe, expect, it } from "vitest";
import {
  HOURS_SEGMENT_KIND_VALUES,
  HoursSegmentKind,
} from "./hours-segment-kinds";

describe("HoursSegmentKind", () => {
  it("keeps the segment kinds and their drawing order stable", () => {
    expect(HoursSegmentKind).toEqual({
      Used: "used",
      Over: "over",
      Open: "open",
      Free: "free",
    });
    expect(HOURS_SEGMENT_KIND_VALUES).toEqual(["used", "over", "open", "free"]);
    expect(new Set(HOURS_SEGMENT_KIND_VALUES).size).toBe(4);
  });
});
