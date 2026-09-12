import { describe, expect, it } from "vitest";
import {
  CUSTOMER_ERROR_CODE_VALUES,
  CustomerErrorCode,
} from "@invessiv/common/constants/crm/errors/customer-error-codes";

describe("CUSTOMER_ERROR_CODE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...CUSTOMER_ERROR_CODE_VALUES]).toEqual(
      Object.values(CustomerErrorCode),
    );
  });

  it("contains no duplicates", () => {
    expect(new Set(CUSTOMER_ERROR_CODE_VALUES).size).toBe(
      CUSTOMER_ERROR_CODE_VALUES.length,
    );
  });

  it("deliberately has no error code for duplicate company names", () => {
    expect(Object.keys(CustomerErrorCode)).not.toContain("CompanyNameExists");
    expect(CUSTOMER_ERROR_CODE_VALUES).not.toContain(
      "COMPANY_NAME_EXISTS" as never,
    );
  });
});
