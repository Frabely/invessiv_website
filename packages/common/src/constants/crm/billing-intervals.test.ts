import { describe, expect, it } from "vitest";

import {
  BILLING_INTERVAL_VALUES,
  BillingInterval,
} from "@invessiv/common/constants/crm/billing-intervals";

describe("BillingInterval", () => {
  it("lists every const value exactly once", () => {
    expect(BILLING_INTERVAL_VALUES).toEqual(["monthly", "yearly"]);
    expect(BILLING_INTERVAL_VALUES).toEqual(Object.values(BillingInterval));
    expect(new Set(BILLING_INTERVAL_VALUES).size).toBe(
      BILLING_INTERVAL_VALUES.length,
    );
  });
});
