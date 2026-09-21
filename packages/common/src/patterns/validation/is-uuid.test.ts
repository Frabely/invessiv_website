import { describe, expect, it } from "vitest";

import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";

describe("isUuid", () => {
  it("accepts a well-formed id in either letter case", () => {
    expect(isUuid("33333333-3333-4333-8333-333333333333")).toBe(true);
    expect(isUuid("9C8F1A10-1B1A-4A10-8E10-00000000F001")).toBe(true);
  });

  it("rejects anything that is not an id", () => {
    for (const value of [
      "",
      "42",
      "not-a-uuid",
      "33333333-3333-4333-8333-33333333333",
      "33333333-3333-4333-8333-3333333333333",
      "1; drop table tasks",
    ]) {
      expect(isUuid(value)).toBe(false);
    }
  });
});
