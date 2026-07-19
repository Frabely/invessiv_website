import { describe, expect, it, vi } from "vitest";
import { rangeResolverService } from "@/server/workspace/dashboard/services/range-resolver-service";

vi.mock("server-only", () => ({}));

const NOW = new Date("2026-05-21T12:00:00.000Z");

describe("rangeResolverService.resolveDashboardRange", () => {
  it("defaults to the last 7 calendar days when no date params are set", () => {
    const result = rangeResolverService.resolveDashboardRange({}, { now: NOW });

    expect(result.kind).toBe("bounded");
    if (result.kind !== "bounded") throw new Error("expected bounded range");
    expect(result.to.toISOString()).toBe("2026-05-21T23:59:59.999Z");
    expect(result.from.toISOString()).toBe("2026-05-15T00:00:00.000Z");
  });

  it("populates the input values with the effective default window", () => {
    const result = rangeResolverService.resolveDashboardRange({}, { now: NOW });

    expect(result.toInputValue).toBe("2026-05-21");
    expect(result.fromInputValue).toBe("2026-05-15");
  });

  it("uses provided date_from and date_to from search params", () => {
    const result = rangeResolverService.resolveDashboardRange(
      { date_from: "2026-01-01", date_to: "2026-03-31" },
      { now: NOW },
    );

    expect(result.kind).toBe("bounded");
    if (result.kind !== "bounded") throw new Error("expected bounded range");
    expect(result.fromInputValue).toBe("2026-01-01");
    expect(result.toInputValue).toBe("2026-03-31");
    expect(result.from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(result.to.toISOString()).toBe("2026-03-31T23:59:59.999Z");
  });

  it("falls back to the default for an invalid date string", () => {
    const result = rangeResolverService.resolveDashboardRange(
      { date_from: "not-a-date" },
      { now: NOW },
    );

    expect(result.fromInputValue).toBe("2026-05-15");
  });

  it("uses the first value when params arrive as an array", () => {
    const result = rangeResolverService.resolveDashboardRange(
      { date_from: ["2026-02-01", "2026-04-01"] },
      { now: NOW },
    );

    expect(result.fromInputValue).toBe("2026-02-01");
  });

  it("swaps inverted ranges so from <= to", () => {
    const result = rangeResolverService.resolveDashboardRange(
      { date_from: "2026-03-31", date_to: "2026-01-01" },
      { now: NOW },
    );

    expect(result.kind).toBe("bounded");
    if (result.kind !== "bounded") throw new Error("expected bounded range");
    expect(result.fromInputValue).toBe("2026-01-01");
    expect(result.toInputValue).toBe("2026-03-31");
  });

  it("computes the immediately preceding window of the same length for comparison", () => {
    const result = rangeResolverService.resolveDashboardRange(
      { date_from: "2026-04-01", date_to: "2026-04-30" },
      { now: NOW },
    );

    expect(result.kind).toBe("bounded");
    if (result.kind !== "bounded") throw new Error("expected bounded range");
    expect(result.previousTo.getTime()).toBe(result.from.getTime());
    const span = result.to.getTime() - result.from.getTime();
    expect(result.previousFrom.getTime()).toBe(result.from.getTime() - span);
  });

  it("uses now() as the default reference time when no override is given", () => {
    const before = Date.now();
    const result = rangeResolverService.resolveDashboardRange({});
    expect(result.toInputValue).toBe(
      new Date(before).toISOString().slice(0, 10),
    );
  });

  it("returns the explicit unbounded state for range=all", () => {
    expect(
      rangeResolverService.resolveDashboardRange(
        { range: "all", date_from: "2026-01-01" },
        { now: NOW },
      ),
    ).toEqual({ kind: "all", fromInputValue: "", toInputValue: "" });
  });
});
