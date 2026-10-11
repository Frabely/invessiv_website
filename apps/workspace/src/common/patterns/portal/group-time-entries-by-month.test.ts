import { describe, expect, it } from "vitest";
import { groupTimeEntriesByMonth } from "./group-time-entries-by-month";

const entry = (id: string, performedOn: string) => ({ id, performedOn });

describe("groupTimeEntriesByMonth", () => {
  it("returns nothing for an empty list", () => {
    expect(groupTimeEntriesByMonth([])).toEqual([]);
  });

  it("keeps the list order and opens a group per calendar month", () => {
    const a = entry("a", "2026-10-09");
    const b = entry("b", "2026-10-01");
    const c = entry("c", "2026-09-30");
    const d = entry("d", "2025-10-15");

    expect(groupTimeEntriesByMonth([a, b, c, d])).toEqual([
      { month: "2026-10", entries: [a, b] },
      { month: "2026-09", entries: [c] },
      { month: "2025-10", entries: [d] },
    ]);
  });
});
