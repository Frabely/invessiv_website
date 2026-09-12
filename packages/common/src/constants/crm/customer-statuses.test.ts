import { describe, expect, it } from "vitest";
import {
  CUSTOMER_ACTIVE_STATUS_VALUES,
  CUSTOMER_STATUS_VALUES,
  CustomerStatus,
} from "@invessiv/common/constants/crm/customer-statuses";

describe("CUSTOMER_STATUS_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...CUSTOMER_STATUS_VALUES]).toEqual(Object.values(CustomerStatus));
  });

  it("contains no duplicates", () => {
    expect(new Set(CUSTOMER_STATUS_VALUES).size).toBe(
      CUSTOMER_STATUS_VALUES.length,
    );
  });

  it("covers only active, paused and archived", () => {
    expect([...CUSTOMER_STATUS_VALUES]).toEqual([
      "active",
      "paused",
      "archived",
    ]);
  });
});

describe("CUSTOMER_ACTIVE_STATUS_VALUES", () => {
  it("excludes archived", () => {
    expect(CUSTOMER_ACTIVE_STATUS_VALUES).not.toContain(
      CustomerStatus.Archived,
    );
  });

  it("is a strict subset of all statuses", () => {
    for (const status of CUSTOMER_ACTIVE_STATUS_VALUES) {
      expect(CUSTOMER_STATUS_VALUES).toContain(status);
    }
    expect(CUSTOMER_ACTIVE_STATUS_VALUES.length).toBeLessThan(
      CUSTOMER_STATUS_VALUES.length,
    );
  });
});
