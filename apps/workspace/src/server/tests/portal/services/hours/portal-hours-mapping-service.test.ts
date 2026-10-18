import { describe, expect, it } from "vitest";

import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { PortalTimeEntryRow } from "@invessiv/common/contracts/portal/rows/portal-time-entry-row";
import { computeCustomerHoursBalance } from "@invessiv/common/patterns/crm/hours/hours-balance";
import { portalHoursMappingService } from "@/server/portal/services/hours/portal-hours-mapping-service";
import type { ProjectHoursSums } from "@invessiv/common/contracts/crm/hours/project-hours-sums";
import { portalHoursBreakdown } from "@/common/patterns/portal/portal-hours-breakdown";

function sums(overrides: Partial<ProjectHoursSums>): ProjectHoursSums {
  return {
    projectId: "project-a",
    title: "Website",
    status: ProjectStatus.Active,
    allocatedMinutes: 0,
    usedMinutes: 0,
    goodwillMinutes: 0,
    ...overrides,
  };
}

function entryRow(
  overrides: Partial<PortalTimeEntryRow> = {},
): PortalTimeEntryRow {
  return {
    id: "entry-1",
    project_id: "project-a",
    performed_on: "2026-10-01",
    duration_minutes: 60,
    description: "Umbau Hero-Section",
    billable: true,
    created_at: new Date("2026-10-01T08:00:00.000Z"),
    task_title: null,
    task_visible_to_customer: null,
    ...overrides,
  };
}

describe("portalHoursMappingService.toHoursDto", () => {
  const balance = computeCustomerHoursBalance({
    purchasedMinutes: 600,
    allocatedMinutes: 480,
    usedMinutes: 510,
    goodwillMinutes: 30,
  });

  it("maps the balance without goodwill and names the free stock unassigned", () => {
    const dto = portalHoursMappingService.toHoursDto({
      balance,
      projectSums: [],
      visibleProjectIds: new Set(),
      purchaseRows: [],
      canReadEntries: true,
    });

    expect(dto.balance).toEqual({
      purchasedMinutes: 600,
      usedMinutes: 510,
      remainingMinutes: 90,
      unassignedMinutes: 120,
    });
    expect(dto.projects).toEqual([]);
    expect(dto.earlierProjects).toBeNull();
    expect(dto.purchases).toEqual([]);
    expect(dto.canReadEntries).toBe(true);
  });

  it("lists every visible project newest first, including untouched ones", () => {
    const dto = portalHoursMappingService.toHoursDto({
      balance,
      projectSums: [
        sums({
          projectId: "old",
          title: "Alt",
          allocatedMinutes: 300,
          usedMinutes: 150,
        }),
        sums({ projectId: "idle", title: "Leer" }),
        sums({
          projectId: "new",
          title: "Neu",
          allocatedMinutes: 300,
          usedMinutes: 360,
        }),
        sums({ projectId: "goodwill", title: "Kulanz", goodwillMinutes: 15 }),
      ],
      visibleProjectIds: new Set(["old", "idle", "new", "goodwill"]),
      purchaseRows: [],
      canReadEntries: false,
    });

    expect(dto.projects).toEqual([
      {
        projectId: "goodwill",
        title: "Kulanz",
        allocatedMinutes: 0,
        usedMinutes: 0,
        remainingMinutes: 0,
      },
      {
        projectId: "new",
        title: "Neu",
        allocatedMinutes: 300,
        usedMinutes: 360,
        remainingMinutes: -60,
      },
      {
        projectId: "idle",
        title: "Leer",
        allocatedMinutes: 0,
        usedMinutes: 0,
        remainingMinutes: 0,
      },
      {
        projectId: "old",
        title: "Alt",
        allocatedMinutes: 300,
        usedMinutes: 150,
        remainingMinutes: 150,
      },
    ]);
    expect(dto.earlierProjects).toBeNull();
  });

  it("keeps projects without bookings selectable, whether assigned hours or not", () => {
    const dto = portalHoursMappingService.toHoursDto({
      balance: computeCustomerHoursBalance({
        purchasedMinutes: 300,
        allocatedMinutes: 180,
        usedMinutes: 0,
        goodwillMinutes: 0,
      }),
      projectSums: [
        sums({ projectId: "assigned", allocatedMinutes: 180 }),
        sums({ projectId: "empty", title: "Empty" }),
        sums({ projectId: "hidden-empty", status: ProjectStatus.Archived }),
      ],
      visibleProjectIds: new Set(["assigned", "empty"]),
      purchaseRows: [],
      canReadEntries: true,
    });

    expect(dto.projects).toEqual([
      {
        projectId: "empty",
        title: "Empty",
        allocatedMinutes: 0,
        usedMinutes: 0,
        remainingMinutes: 0,
      },
      {
        projectId: "assigned",
        title: "Website",
        allocatedMinutes: 180,
        usedMinutes: 0,
        remainingMinutes: 180,
      },
    ]);
    expect(dto.earlierProjects).toBeNull();
  });

  it("matches dashboard status groups and keeps newest first within each group", () => {
    // The sums arrive in creation order, oldest first.
    const projectSums = [
      sums({ projectId: "active-old", allocatedMinutes: 60 }),
      sums({
        projectId: "paused-old",
        status: ProjectStatus.Paused,
        allocatedMinutes: 60,
      }),
      sums({ projectId: "active-new", allocatedMinutes: 60 }),
      sums({
        projectId: "planned",
        status: ProjectStatus.Planned,
        allocatedMinutes: 60,
      }),
      sums({
        projectId: "paused-new",
        status: ProjectStatus.Paused,
        allocatedMinutes: 60,
      }),
      sums({
        projectId: "completed",
        status: ProjectStatus.Completed,
        allocatedMinutes: 60,
      }),
    ];
    const dto = portalHoursMappingService.toHoursDto({
      balance,
      projectSums,
      visibleProjectIds: new Set(
        projectSums.map((project) => project.projectId),
      ),
      purchaseRows: [],
      canReadEntries: true,
    });

    expect(dto.projects.map((project) => project.projectId)).toEqual([
      "active-new",
      "active-old",
      "paused-new",
      "paused-old",
      "planned",
      "completed",
    ]);
    expect(projectSums.map((project) => project.projectId)).toEqual([
      "active-old",
      "paused-old",
      "active-new",
      "planned",
      "paused-new",
      "completed",
    ]);
  });

  it("sums every hidden project into one row without a title", () => {
    const dto = portalHoursMappingService.toHoursDto({
      balance,
      projectSums: [
        sums({ projectId: "shown", allocatedMinutes: 60 }),
        sums({
          projectId: "archived",
          status: ProjectStatus.Archived,
          allocatedMinutes: 120,
          usedMinutes: 150,
        }),
        sums({
          projectId: "cancelled",
          status: ProjectStatus.Cancelled,
          allocatedMinutes: 60,
          usedMinutes: 15,
        }),
        sums({ projectId: "hidden-idle", status: ProjectStatus.Archived }),
      ],
      visibleProjectIds: new Set(["shown"]),
      purchaseRows: [],
      canReadEntries: false,
    });

    expect(dto.projects.map((project) => project.projectId)).toEqual(["shown"]);
    expect(dto.earlierProjects).toEqual({
      allocatedMinutes: 180,
      usedMinutes: 165,
      remainingMinutes: 15,
      openMinutes: 45,
      overMinutes: 30,
    });
  });

  it.each([[], ["project-a"], ["project-a", "project-b"]])(
    "preserves the company split for visible projects %j",
    (...visibleIds) => {
      const projectSums = [
        sums({ allocatedMinutes: 300, usedMinutes: 360 }),
        sums({
          projectId: "project-b",
          allocatedMinutes: 300,
          usedMinutes: 240,
        }),
      ];
      const dto = portalHoursMappingService.toHoursDto({
        balance: computeCustomerHoursBalance({
          purchasedMinutes: 600,
          allocatedMinutes: 600,
          usedMinutes: 600,
          goodwillMinutes: 0,
        }),
        projectSums,
        visibleProjectIds: new Set(visibleIds),
        purchaseRows: [],
        canReadEntries: true,
      });

      expect(portalHoursBreakdown.of(dto)).toEqual({
        purchasedMinutes: 600,
        usedMinutes: 600,
        freeMinutes: 0,
        openMinutes: 60,
        overMinutes: 60,
      });
    },
  );

  it("marks corrections and keeps the purchase order", () => {
    const dto = portalHoursMappingService.toHoursDto({
      balance,
      projectSums: [],
      visibleProjectIds: new Set(),
      purchaseRows: [
        {
          kind: HourPurchaseKind.Correction,
          minutes: -60,
          purchased_on: "2026-10-02",
          note: "",
        },
        {
          kind: HourPurchaseKind.Purchase,
          minutes: 600,
          purchased_on: "2026-10-01",
          note: "Betreuung",
        },
      ],
      canReadEntries: false,
    });

    expect(dto.purchases).toEqual([
      { purchasedOn: "2026-10-02", minutes: -60, isCorrection: true, note: "" },
      {
        purchasedOn: "2026-10-01",
        minutes: 600,
        isCorrection: false,
        note: "Betreuung",
      },
    ]);
  });
});

describe("portalHoursMappingService.toTimeEntryDto", () => {
  const view = {
    visibleProjectIds: new Set(["project-a"]),
    showTaskTitles: true,
  };

  it("maps an entry without a task", () => {
    expect(portalHoursMappingService.toTimeEntryDto(entryRow(), view)).toEqual({
      id: "entry-1",
      projectId: "project-a",
      performedOn: "2026-10-01",
      durationMinutes: 60,
      description: "Umbau Hero-Section",
      billable: true,
      taskTitle: null,
    });
  });

  it("drops the project of an entry the portal does not show", () => {
    expect(
      portalHoursMappingService.toTimeEntryDto(
        entryRow({ project_id: "archived" }),
        view,
      ).projectId,
    ).toBeNull();
  });

  it("names the task only when it is customer-visible and the reader may read tasks", () => {
    const visible = entryRow({
      task_title: "Hero",
      task_visible_to_customer: true,
    });
    const internal = entryRow({
      task_title: "Intern",
      task_visible_to_customer: false,
    });

    expect(
      portalHoursMappingService.toTimeEntryDto(visible, view).taskTitle,
    ).toBe("Hero");
    expect(
      portalHoursMappingService.toTimeEntryDto(internal, view).taskTitle,
    ).toBeNull();
    expect(
      portalHoursMappingService.toTimeEntryDto(visible, {
        ...view,
        showTaskTitles: false,
      }).taskTitle,
    ).toBeNull();
  });
});
