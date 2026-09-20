import { describe, expect, it } from "vitest";

import { parseExactCustomerNumber } from "@/common/patterns/access/customer-number-search";

describe("parseExactCustomerNumber", () => {
  it("reads a purely numeric search as a customer number", () => {
    expect(parseExactCustomerNumber("12")).toBe(12);
    expect(parseExactCustomerNumber("1")).toBe(1);
  });

  it("ignores leading zeros so a printed number still matches", () => {
    expect(parseExactCustomerNumber("0012")).toBe(12);
  });

  it("leaves a name or a mixed search alone", () => {
    expect(parseExactCustomerNumber("Nordlicht")).toBeNull();
    expect(parseExactCustomerNumber("K0012")).toBeNull();
    expect(parseExactCustomerNumber("12 Nord")).toBeNull();
    expect(parseExactCustomerNumber("1.5")).toBeNull();
    expect(parseExactCustomerNumber("-3")).toBeNull();
  });

  it("returns null for an empty search and for zero, which is no customer number", () => {
    expect(parseExactCustomerNumber("")).toBeNull();
    expect(parseExactCustomerNumber("0")).toBeNull();
    expect(parseExactCustomerNumber("000")).toBeNull();
  });

  it("returns null above the integer column range instead of failing the query", () => {
    expect(parseExactCustomerNumber("2147483647")).toBe(2147483647);
    expect(parseExactCustomerNumber("2147483648")).toBeNull();
    expect(parseExactCustomerNumber("9".repeat(100))).toBeNull();
  });
});
