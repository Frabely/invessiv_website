import { describe, expect, it } from "vitest";
import { formatCalendarDay } from "./format-calendar-day";

describe("formatCalendarDay", () => {
  it("prints the same calendar day regardless of the runtime time zone", () => {
    expect(formatCalendarDay("2026-10-16", "de")).toBe("16. Okt. 2026");
    expect(formatCalendarDay("2026-10-16", "en")).toBe("Oct 16, 2026");
  });
});
