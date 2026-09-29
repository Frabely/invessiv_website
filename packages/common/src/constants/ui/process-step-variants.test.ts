import { describe, expect, it } from "vitest";

import { ProcessStepVariant } from "@invessiv/common/constants/ui/process-step-variants";

describe("ProcessStepVariant", () => {
  it("lists every value exactly once", () => {
    const values = Object.values(ProcessStepVariant);

    expect(values).toEqual(["default", "accent"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
