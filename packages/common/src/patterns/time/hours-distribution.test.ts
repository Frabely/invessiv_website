import { describe, expect, it } from "vitest";
import { hoursDistribution } from "./hours-distribution";

describe("hoursDistribution", () => {
  it("preserves another project's remainder when one project is overdrawn", () => {
    const overdrawn = hoursDistribution.projectUsage({
      allocatedMinutes: 300,
      usedMinutes: 360,
      remainingMinutes: -60,
    });
    const open = hoursDistribution.projectUsage({
      allocatedMinutes: 300,
      usedMinutes: 240,
      remainingMinutes: 60,
    });
    const company = hoursDistribution.companyUsage({
      purchasedMinutes: 600,
      usedMinutes: overdrawn.usedMinutes + open.usedMinutes,
      openMinutes: overdrawn.openMinutes + open.openMinutes,
      freeMinutes: 0,
    });

    expect(company).toEqual({
      purchasedMinutes: 600,
      usedMinutes: 600,
      openMinutes: 60,
      freeMinutes: 0,
      overMinutes: 60,
    });
    expect(hoursDistribution.companySegments(company)).toEqual([
      { kind: "used", minutes: 540 },
      { kind: "over", minutes: 60 },
      { kind: "open", minutes: 60 },
      { kind: "free", minutes: 0 },
    ]);
  });

  it("retains the split of anonymized projects even when their net balance is zero", () => {
    expect(
      hoursDistribution.projectSegments({
        usedMinutes: 600,
        openMinutes: 60,
        overMinutes: 60,
      }),
    ).toEqual([
      { kind: "used", minutes: 540 },
      { kind: "over", minutes: 60 },
      { kind: "open", minutes: 60 },
    ]);
  });

  it("shows consumption without an allocation entirely as an overrun", () => {
    expect(
      hoursDistribution.projectSegments({
        allocatedMinutes: 0,
        usedMinutes: 15,
        remainingMinutes: -15,
      }),
    ).toEqual([
      { kind: "used", minutes: 0 },
      { kind: "over", minutes: 15 },
      { kind: "open", minutes: 0 },
    ]);
  });

  it("does not draw negative free stock", () => {
    expect(
      hoursDistribution.companyUsage({
        purchasedMinutes: 0,
        usedMinutes: 15,
        openMinutes: 0,
        freeMinutes: -30,
      }),
    ).toEqual({
      purchasedMinutes: 0,
      usedMinutes: 15,
      openMinutes: 0,
      freeMinutes: 0,
      overMinutes: 15,
    });
  });

  it("sums only positive project remainders, including pre-aggregated ones", () => {
    expect(
      hoursDistribution.companyFromProjects(
        { purchasedMinutes: 600, usedMinutes: 600, freeMinutes: 0 },
        [
          { allocatedMinutes: 300, usedMinutes: 360, remainingMinutes: -60 },
          { allocatedMinutes: 200, usedMinutes: 170, remainingMinutes: 30 },
          { usedMinutes: 70, openMinutes: 30, overMinutes: 0 },
        ],
      ),
    ).toEqual({
      purchasedMinutes: 600,
      usedMinutes: 600,
      freeMinutes: 0,
      openMinutes: 60,
      overMinutes: 60,
    });
  });
});
