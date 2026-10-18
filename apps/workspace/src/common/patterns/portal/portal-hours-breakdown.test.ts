import { describe, expect, it } from "vitest";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import { portalHoursBreakdown } from "./portal-hours-breakdown";

function hours(overrides: Partial<PortalHoursDto> = {}): PortalHoursDto {
  return {
    balance: {
      purchasedMinutes: 600,
      usedMinutes: 150,
      remainingMinutes: 450,
      unassignedMinutes: 120,
    },
    projects: [
      {
        projectId: "a",
        title: "Website",
        allocatedMinutes: 300,
        usedMinutes: 150,
        remainingMinutes: 150,
      },
      {
        projectId: "b",
        title: "Shop",
        allocatedMinutes: 180,
        usedMinutes: 0,
        remainingMinutes: 180,
      },
    ],
    earlierProjects: null,
    purchases: [],
    canReadEntries: true,
    ...overrides,
  };
}

describe("portalHoursBreakdown.of", () => {
  it("splits what was bought into used, open in projects and free", () => {
    expect(portalHoursBreakdown.of(hours())).toEqual({
      purchasedMinutes: 600,
      usedMinutes: 150,
      openMinutes: 330,
      freeMinutes: 120,
      overMinutes: 0,
    });
  });

  it("counts an overdrawn project as over instead of reducing the open rest", () => {
    const breakdown = portalHoursBreakdown.of(
      hours({
        balance: {
          purchasedMinutes: 600,
          usedMinutes: 360,
          remainingMinutes: 240,
          unassignedMinutes: 120,
        },
        projects: [
          {
            projectId: "a",
            title: "Website",
            allocatedMinutes: 300,
            usedMinutes: 360,
            remainingMinutes: -60,
          },
          {
            projectId: "b",
            title: "Shop",
            allocatedMinutes: 180,
            usedMinutes: 0,
            remainingMinutes: 180,
          },
        ],
      }),
    );

    expect(breakdown.openMinutes).toBe(180);
    expect(breakdown.overMinutes).toBe(60);
    expect(
      breakdown.usedMinutes +
        breakdown.openMinutes +
        breakdown.freeMinutes -
        breakdown.overMinutes,
    ).toBe(breakdown.purchasedMinutes);
  });

  it("includes earlier projects and never shows negative free hours", () => {
    const breakdown = portalHoursBreakdown.of(
      hours({
        balance: {
          purchasedMinutes: 600,
          usedMinutes: 150,
          remainingMinutes: 450,
          unassignedMinutes: -30,
        },
        earlierProjects: {
          allocatedMinutes: 60,
          usedMinutes: 0,
          remainingMinutes: 60,
          openMinutes: 60,
          overMinutes: 0,
        },
      }),
    );

    expect(breakdown.openMinutes).toBe(390);
    expect(breakdown.freeMinutes).toBe(0);
  });
});

describe("portalHoursBreakdown segments", () => {
  it("keeps open and overdrawn earlier hours separate despite a zero net remainder", () => {
    const earlierProjects = {
      allocatedMinutes: 600,
      usedMinutes: 600,
      remainingMinutes: 0,
      openMinutes: 60,
      overMinutes: 60,
    };
    const breakdown = portalHoursBreakdown.of(
      hours({
        balance: {
          purchasedMinutes: 600,
          usedMinutes: 600,
          remainingMinutes: 0,
          unassignedMinutes: 0,
        },
        projects: [],
        earlierProjects,
      }),
    );

    expect(breakdown.openMinutes).toBe(60);
    expect(breakdown.overMinutes).toBe(60);
    expect(portalHoursBreakdown.projectSegments(earlierProjects)).toEqual([
      { kind: "used", minutes: 540 },
      { kind: "over", minutes: 60 },
      { kind: "open", minutes: 60 },
    ]);
    expect(portalHoursBreakdown.projectUsage(earlierProjects)).toEqual({
      usedMinutes: 600,
      openMinutes: 60,
      overMinutes: 60,
    });
  });

  it("draws the company bar with the overdrawn part taken out of used", () => {
    expect(
      portalHoursBreakdown.companySegments({
        purchasedMinutes: 600,
        usedMinutes: 360,
        openMinutes: 180,
        freeMinutes: 120,
        overMinutes: 60,
      }),
    ).toEqual([
      { kind: "used", minutes: 300 },
      { kind: "over", minutes: 60 },
      { kind: "open", minutes: 180 },
      { kind: "free", minutes: 120 },
    ]);
  });

  it("draws a project bar within, beyond and below its assignment", () => {
    expect(
      portalHoursBreakdown.projectSegments({
        allocatedMinutes: 300,
        usedMinutes: 360,
        remainingMinutes: -60,
      }),
    ).toEqual([
      { kind: "used", minutes: 300 },
      { kind: "over", minutes: 60 },
      { kind: "open", minutes: 0 },
    ]);
    expect(
      portalHoursBreakdown.projectSegments({
        allocatedMinutes: 300,
        usedMinutes: 150,
        remainingMinutes: 150,
      }),
    ).toEqual([
      { kind: "used", minutes: 150 },
      { kind: "over", minutes: 0 },
      { kind: "open", minutes: 150 },
    ]);
  });
});
