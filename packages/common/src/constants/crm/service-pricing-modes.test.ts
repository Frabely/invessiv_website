import { describe, expect, it } from "vitest";

import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";

describe("ServicePricingMode", () => {
  it("lists every const value exactly once", () => {
    expect(SERVICE_PRICING_MODE_VALUES).toEqual([
      "one_time",
      "recurring",
      "rate",
    ]);
    expect(SERVICE_PRICING_MODE_VALUES).toEqual(
      Object.values(ServicePricingMode),
    );
    expect(new Set(SERVICE_PRICING_MODE_VALUES).size).toBe(
      SERVICE_PRICING_MODE_VALUES.length,
    );
  });
});
