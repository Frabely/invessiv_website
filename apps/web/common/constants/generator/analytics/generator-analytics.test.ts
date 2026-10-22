import { describe, expect, it } from "vitest";

import { GeneratorErrorReason } from "./generator-analytics";

describe("generator analytics constants", () => {
  it("keeps the client-side network error reason stable", () => {
    expect(GeneratorErrorReason).toEqual({
      Network: "network",
      Validation: "validation",
    });
  });
});
