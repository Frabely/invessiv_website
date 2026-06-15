import { describe, expect, it } from "vitest";
import { LeadFilterSelectId } from "./lead-filter-select-ids";

describe("LeadFilterSelectId", () => {
  it("exposes the expected ids", () => {
    expect(LeadFilterSelectId).toEqual({
      Score: "leads-score-filter",
      Status: "leads-mobile-status-filter",
      Category: "leads-mobile-category-filter",
      Source: "leads-mobile-source-filter",
      Profile: "leads-mobile-profile-filter",
    });
  });

  it("has no duplicate ids", () => {
    const values = Object.values(LeadFilterSelectId);
    expect(new Set(values).size).toBe(values.length);
  });
});
