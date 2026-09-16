import { describe, expect, it } from "vitest";

import {
  formatCentsAsEuroInput,
  parseEuroAmountToCents,
} from "@/common/patterns/crm/euro-cents";

describe("parseEuroAmountToCents", () => {
  it.each([
    ["95", 9500],
    ["95,5", 9550],
    ["95.50", 9550],
    [" 120,05 € ", 12005],
    ["0", 0],
  ])("parses %s to %i cents", (input, cents) => {
    expect(parseEuroAmountToCents(input)).toEqual({ ok: true, cents });
  });

  it("treats an empty input as no amount", () => {
    expect(parseEuroAmountToCents("  ")).toEqual({ ok: true, cents: null });
  });

  it.each(["-5", "1.500,00", "12,345", "abc", "1e3"])("rejects %s", (input) => {
    expect(parseEuroAmountToCents(input)).toEqual({ ok: false });
  });
});

describe("formatCentsAsEuroInput", () => {
  it("formats whole euros without decimals and keeps cents otherwise", () => {
    expect(formatCentsAsEuroInput(9500, "de")).toBe("95");
    expect(formatCentsAsEuroInput(9550, "de")).toBe("95,50");
    expect(formatCentsAsEuroInput(9550, "en")).toBe("95.50");
    expect(formatCentsAsEuroInput(123456, "de")).toBe("1234,56");
  });

  it("returns an empty input for no amount", () => {
    expect(formatCentsAsEuroInput(null, "de")).toBe("");
  });

  it("round-trips through the parser", () => {
    expect(parseEuroAmountToCents(formatCentsAsEuroInput(9550, "de"))).toEqual({
      ok: true,
      cents: 9550,
    });
  });
});
