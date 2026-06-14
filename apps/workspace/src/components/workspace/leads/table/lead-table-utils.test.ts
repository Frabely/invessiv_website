import { describe, expect, it } from "vitest";
import { buildLeadHref } from "./lead-table-utils";

describe("buildLeadHref", () => {
  it("sets and removes params based on the overrides", () => {
    const href = buildLeadHref("/de/leads", "status=new", {
      source: "manual",
      status: undefined,
    });
    const params = new URLSearchParams(href.split("?")[1] ?? "");

    expect(params.get("source")).toBe("manual");
    expect(params.has("status")).toBe(false);
  });

  it("keeps commas literal for multi-value params (no %2C encoding)", () => {
    const href = buildLeadHref("/de/leads", "", {
      profile_include: "linkedin,youtube",
    });

    expect(href).toContain("profile_include=linkedin,youtube");
    expect(href).not.toContain("%2C");
  });

  it("returns the base path when no params remain", () => {
    expect(
      buildLeadHref("/de/leads", "status=new", { status: undefined }),
    ).toBe("/de/leads");
  });
});
