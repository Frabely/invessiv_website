import { describe, expect, it } from "vitest";
import {
  formatCustomerNumber,
  parseCustomerNumberInput,
} from "@invessiv/common/patterns/crm/format-customer-number";

describe("parseCustomerNumberInput", () => {
  it.each([
    ["2", 2],
    ["0002", 2],
    ["K0002", 2],
    ["k2", 2],
    [" K0042 ", 42],
    ["999999", 999_999],
  ])("reads %j as %i", (input, expected) => {
    expect(parseCustomerNumberInput(input, 999_999)).toBe(expected);
  });

  it.each(["", "K", "0", "K0000", "-1", "1.5", "12a", "KK2", "1000000"])(
    "rejects %j",
    (input) => {
      expect(parseCustomerNumberInput(input, 999_999)).toBeNull();
    },
  );

  it("round-trips the display format", () => {
    expect(parseCustomerNumberInput(formatCustomerNumber(9), 999_999)).toBe(9);
  });
});

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
