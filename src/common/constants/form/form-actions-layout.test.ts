import { describe, expect, it } from "vitest";
import { FormActionsLayout } from "@/common/constants/form/form-actions-layout";

describe("FormActionsLayout", () => {
  it("contains the expected layouts in PascalCase keys", () => {
    expect(FormActionsLayout).toEqual({
      Inline: "inline",
      Stacked: "stacked",
    });
  });

  it("has no duplicate values", () => {
    expect(new Set(Object.values(FormActionsLayout)).size).toBe(
      Object.values(FormActionsLayout).length,
    );
  });
});
