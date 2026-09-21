import { describe, expect, it } from "vitest";

import { LineItemTemplateFormDialogMode } from "@/common/constants/crm/forms/line-item-template-form-dialog-modes";

describe("LineItemTemplateFormDialogMode", () => {
  it("contains the exact modes without duplicates", () => {
    const values = Object.values(LineItemTemplateFormDialogMode);

    expect(values).toEqual(["create", "edit"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
