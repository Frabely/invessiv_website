import { describe, expect, it } from "vitest";

import { ServiceTemplateFormDialogMode } from "@/common/constants/crm/forms/service-template-form-dialog-modes";

describe("ServiceTemplateFormDialogMode", () => {
  it("contains the exact modes without duplicates", () => {
    const values = Object.values(ServiceTemplateFormDialogMode);

    expect(values).toEqual(["create", "edit"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
