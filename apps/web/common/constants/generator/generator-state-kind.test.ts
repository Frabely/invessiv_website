import { describe, expect, it } from "vitest";

import { GeneratorStateKind } from "./generator-state-kind";

describe("GeneratorStateKind", () => {
  it("exposes the exact state discriminants", () => {
    expect(GeneratorStateKind).toEqual({
      Idle: "idle",
      Loading: "loading",
      Success: "success",
      Error: "error",
    });
  });

  it("has no duplicate values", () => {
    const values = Object.values(GeneratorStateKind);
    expect(new Set(values).size).toBe(values.length);
  });
});
