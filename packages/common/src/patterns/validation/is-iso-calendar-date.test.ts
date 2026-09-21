import { describe, expect, it } from "vitest";

import { isIsoCalendarDate } from "@invessiv/common/patterns/validation/is-iso-calendar-date";

describe("isIsoCalendarDate", () => {
  it("accepts real days including a leap day", () => {
    expect(isIsoCalendarDate("2026-09-21")).toBe(true);
    expect(isIsoCalendarDate("2028-02-29")).toBe(true);
  });

  it("rejects days that only look like dates", () => {
    for (const value of [
      "2026-02-30",
      "2027-02-29",
      "2026-13-01",
      "2026-00-10",
      "2026-04-31",
    ]) {
      expect(isIsoCalendarDate(value)).toBe(false);
    }
  });

  it("rejects other shapes", () => {
    for (const value of [
      "",
      "01.10.2026",
      "2026-9-1",
      "2026-09-21T10:00:00Z",
    ]) {
      expect(isIsoCalendarDate(value)).toBe(false);
    }
  });
});
