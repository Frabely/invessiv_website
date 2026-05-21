import { describe, expect, it } from "vitest";
import {
  buildDashboardHref,
  serializeDashboardSearchParams,
} from "./dashboard-query-string";

describe("serializeDashboardSearchParams", () => {
  it("returns an empty string for empty input", () => {
    expect(serializeDashboardSearchParams({})).toBe("");
  });

  it("serializes scalar values into a query string", () => {
    const result = serializeDashboardSearchParams({
      date_from: "2026-04-01",
      date_to: "2026-04-30",
    });

    const params = new URLSearchParams(result);
    expect(params.get("date_from")).toBe("2026-04-01");
    expect(params.get("date_to")).toBe("2026-04-30");
  });

  it("skips undefined values", () => {
    const result = serializeDashboardSearchParams({
      date_from: "2026-04-01",
      date_to: undefined,
    });

    const params = new URLSearchParams(result);
    expect(params.get("date_from")).toBe("2026-04-01");
    expect(params.has("date_to")).toBe(false);
  });

  it("appends each entry of an array value", () => {
    const result = serializeDashboardSearchParams({
      tag: ["a", "b"],
    });

    const params = new URLSearchParams(result);
    expect(params.getAll("tag")).toEqual(["a", "b"]);
  });
});

describe("buildDashboardHref", () => {
  it("appends a query string when overrides set values", () => {
    const href = buildDashboardHref("/de/dashboard", "", {
      date_from: "2026-04-01",
    });

    expect(href).toBe("/de/dashboard?date_from=2026-04-01");
  });

  it("removes the param when the override value is falsy", () => {
    const href = buildDashboardHref("/en/dashboard", "date_from=2026-04-01", {
      date_from: undefined,
    });

    expect(href).toBe("/en/dashboard");
  });

  it("preserves other existing query params", () => {
    const href = buildDashboardHref(
      "/de/dashboard",
      "foo=bar&date_from=2026-04-01",
      { date_to: "2026-04-30" },
    );

    const params = new URLSearchParams(href.split("?")[1] ?? "");
    expect(params.get("foo")).toBe("bar");
    expect(params.get("date_from")).toBe("2026-04-01");
    expect(params.get("date_to")).toBe("2026-04-30");
  });

  it("returns only the base path when all params are cleared", () => {
    const href = buildDashboardHref("/en/dashboard", "date_from=2026-04-01", {
      date_from: undefined,
    });

    expect(href).toBe("/en/dashboard");
  });
});
