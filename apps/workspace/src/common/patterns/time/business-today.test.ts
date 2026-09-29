import { describe, expect, it } from "vitest";
import { businessToday } from "./business-today";

describe("businessToday", () => {
  it("switches the day at midnight in Berlin, not in UTC", () => {
    expect(businessToday(new Date("2026-09-20T22:30:00Z"))).toBe("2026-09-21");
    expect(businessToday(new Date("2026-09-20T21:30:00Z"))).toBe("2026-09-20");
  });
});
