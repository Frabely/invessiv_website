import { describe, expect, it } from "vitest";

import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";

describe("LineItemTemplateFieldLimits", () => {
  it("contains the exact limits", () => {
    expect(LineItemTemplateFieldLimits).toEqual({
      TitleMaxLength: 200,
      DescriptionMaxLength: 4000,
      PriceCentsMax: 2_147_483_647,
    });
  });

  it("keeps the price within a signed 32-bit integer column", () => {
    expect(LineItemTemplateFieldLimits.PriceCentsMax).toBeLessThan(2 ** 31);
  });
});
