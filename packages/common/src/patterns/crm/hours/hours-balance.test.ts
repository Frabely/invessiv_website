import { describe, expect, it } from "vitest";

import {
  computeCustomerHoursBalance,
  computeProjectHoursBalance,
} from "@invessiv/common/patterns/crm/hours/hours-balance";

describe("hours balance", () => {
  it("follows the worked example of the plan", () => {
    // 10:00 purchased, 5:00 allocated to each of two projects, 2:30 and 6:00 booked.
    const customer = computeCustomerHoursBalance({
      purchasedMinutes: 600,
      allocatedMinutes: 600,
      usedMinutes: 510,
      goodwillMinutes: 0,
    });
    const projectA = computeProjectHoursBalance({
      projectId: "a",
      allocatedMinutes: 300,
      usedMinutes: 150,
      goodwillMinutes: 0,
    });
    const projectB = computeProjectHoursBalance({
      projectId: "b",
      allocatedMinutes: 300,
      usedMinutes: 360,
      goodwillMinutes: 0,
    });

    expect(customer.freeMinutes).toBe(0);
    expect(customer.remainingMinutes).toBe(90);
    expect(projectA.remainingMinutes).toBe(150);
    expect(projectA.releasableMinutes).toBe(150);
    expect(projectB.remainingMinutes).toBe(-60);
  });

  it("offers nothing to release while a project is overdrawn", () => {
    expect(
      computeProjectHoursBalance({
        projectId: "b",
        allocatedMinutes: 300,
        usedMinutes: 360,
        goodwillMinutes: 0,
      }).releasableMinutes,
    ).toBe(0);
  });

  it("keeps goodwill out of used and remaining", () => {
    const balance = computeCustomerHoursBalance({
      purchasedMinutes: 600,
      allocatedMinutes: 300,
      usedMinutes: 60,
      goodwillMinutes: 30,
    });
    expect(balance).toEqual({
      purchasedMinutes: 600,
      allocatedMinutes: 300,
      freeMinutes: 300,
      usedMinutes: 60,
      goodwillMinutes: 30,
      remainingMinutes: 540,
    });
  });
});
