import { afterEach, describe, expect, it, vi } from "vitest";
import { formatRelativeTime } from "./format-relative-time";

const dictionary = {
  justNow: "gerade eben",
  hoursAgo: "vor {count} Std.",
  daysAgo: "vor {count} Tagen",
};

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'gerade eben' for less than 60 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-06T12:00:00Z"));

    expect(formatRelativeTime("de", isoMinutesAgo(30), dictionary)).toBe(
      "gerade eben",
    );
  });

  it("returns hours for 1h..24h", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-06T12:00:00Z"));

    expect(formatRelativeTime("de", isoMinutesAgo(60 * 5), dictionary)).toBe(
      "vor 5 Std.",
    );
  });

  it("returns days for 1d..30d", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-06T12:00:00Z"));

    expect(
      formatRelativeTime("de", isoMinutesAgo(60 * 24 * 3), dictionary),
    ).toBe("vor 3 Tagen");
  });

  it("falls back to absolute date for more than 30 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-06T12:00:00Z"));

    const old = new Date("2025-01-15T12:00:00Z").toISOString();
    const result = formatRelativeTime("de", old, dictionary);

    expect(result).not.toMatch(/gerade|Std\.|Tagen/);
    expect(result).toMatch(/2025/);
  });
});
