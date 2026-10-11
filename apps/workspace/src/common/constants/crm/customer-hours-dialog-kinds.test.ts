import { describe, expect, it } from "vitest";
import { CustomerHoursDialogKind } from "./customer-hours-dialog-kinds";

describe("CustomerHoursDialogKind", () => {
  it("defines distinct purchase and allocation dialog kinds", () => {
    expect(CustomerHoursDialogKind).toEqual({
      Purchase: "purchase",
      Allocation: "allocation",
    });
    const values = Object.values(CustomerHoursDialogKind);
    expect(new Set(values).size).toBe(values.length);
  });
});
