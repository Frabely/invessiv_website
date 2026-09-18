import { describe, expect, it } from "vitest";

import { ServiceTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/service-template-field-limits";

describe("ServiceTemplateFieldLimits", () => {
  it("contains the exact limits", () => {
    expect(ServiceTemplateFieldLimits).toEqual({
      TitleMaxLength: 200,
      DescriptionMaxLength: 4000,
      PriceCentsMax: 2_147_483_647,
    });
  });

  it("keeps the price within a signed 32-bit integer column", () => {
    expect(ServiceTemplateFieldLimits.PriceCentsMax).toBeLessThan(2 ** 31);
  });
});
