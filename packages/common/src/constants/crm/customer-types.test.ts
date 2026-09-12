import { describe, expect, it } from "vitest";
import {
  CUSTOMER_TYPE_VALUES,
  CustomerType,
} from "@invessiv/common/constants/crm/customer-types";

describe("CUSTOMER_TYPE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...CUSTOMER_TYPE_VALUES]).toEqual(Object.values(CustomerType));
  });

  it("contains no duplicates", () => {
    expect(new Set(CUSTOMER_TYPE_VALUES).size).toBe(
      CUSTOMER_TYPE_VALUES.length,
    );
  });

  it("distinguishes company from individual", () => {
    expect([...CUSTOMER_TYPE_VALUES]).toEqual(["company", "individual"]);
  });
});
