import { describe, expect, it } from "vitest";

import { BoundedJsonBodyResultKind } from "@/common/constants";

describe("BoundedJsonBodyResultKind", () => {
  it("exposes the exact result discriminants", () => {
    expect(BoundedJsonBodyResultKind).toEqual({
      Ok: "ok",
      PayloadTooLarge: "payload_too_large",
      InvalidJson: "invalid_json",
    });
  });

  it("has no duplicate values", () => {
    const values = Object.values(BoundedJsonBodyResultKind);
    expect(new Set(values).size).toBe(values.length);
  });
});
