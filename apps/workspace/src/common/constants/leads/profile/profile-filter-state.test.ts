import { describe, expect, it } from "vitest";
import { ProfileFilterState } from "./profile-filter-state";

describe("ProfileFilterState", () => {
  it("exposes the three chip cycle states without duplicates", () => {
    const values = Object.values(ProfileFilterState);
    expect(values).toEqual(["inactive", "include", "exclude"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
