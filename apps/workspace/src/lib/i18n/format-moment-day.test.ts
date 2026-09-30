import { describe, expect, it } from "vitest";
import { formatMomentDay } from "./format-moment-day";

describe("formatMomentDay", () => {
  it("prints the Berlin calendar day, also shortly before midnight UTC", () => {
    expect(formatMomentDay("2026-10-16T22:30:00.000Z", "de")).toBe(
      "17. Okt. 2026",
    );
    expect(formatMomentDay("2026-10-16T08:00:00.000Z", "en")).toBe(
      "Oct 16, 2026",
    );
  });
});
