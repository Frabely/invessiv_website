import { describe, expect, it } from "vitest";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";

describe("formatCustomerNumber", () => {
  it.each([
    [1, "K0001"],
    [42, "K0042"],
    [999, "K0999"],
    [1000, "K1000"],
    [10000, "K10000"],
    [99999, "K99999"],
  ])("formats %i as %s", (value, expected) => {
    expect(formatCustomerNumber(value)).toBe(expected);
  });

  it("pads to four digits and grows freely beyond that", () => {
    expect(formatCustomerNumber(9999)).toHaveLength(5);
    expect(formatCustomerNumber(100000)).toBe("K100000");
  });

  it("rejects zero, negative values and non-integers", () => {
    expect(() => formatCustomerNumber(0)).toThrow(RangeError);
    expect(() => formatCustomerNumber(-1)).toThrow(RangeError);
    expect(() => formatCustomerNumber(1.5)).toThrow(RangeError);
  });
});
