import { describe, expect, it } from "vitest";

import { ServiceTemplateFormValidationCode } from "./service-template-form-validation-codes";

describe("ServiceTemplateFormValidationCode", () => {
  it("contains every validation code exactly once", () => {
    const values = Object.values(ServiceTemplateFormValidationCode);

    expect(values).toEqual([
      "TITLE_REQUIRED",
      "PRICE_INVALID",
      "PRICE_OUT_OF_RANGE",
      "RECURRING_INTERVAL_REQUIRED",
    ]);
    expect(new Set(values).size).toBe(values.length);
  });
});
