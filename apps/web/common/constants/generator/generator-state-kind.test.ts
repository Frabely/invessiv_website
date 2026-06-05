import { describe, expect, it } from "vitest";

import { GeneratorStateKind } from "@/common/constants";

describe("GeneratorStateKind", () => {
  it("exposes the exact state discriminants", () => {
    expect(GeneratorStateKind).toEqual({
      Idle: "idle",
      Loading: "loading",
      Success: "success",
      LimitReached: "limit_reached",
      Error: "error",
    });
  });

  it("has no duplicate values", () => {
    const values = Object.values(GeneratorStateKind);
    expect(new Set(values).size).toBe(values.length);
  });
});
