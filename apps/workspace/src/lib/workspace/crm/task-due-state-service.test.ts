import { describe, expect, it } from "vitest";

import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { TaskDueState } from "@/common/constants/crm/task-due-states";
import { taskDueStateService } from "@/lib/workspace/crm/task-due-state-service";

const TODAY = "2026-09-21";

describe("taskDueStateService.dueState", () => {
  it("marks an open task with a past due day as overdue", () => {
    expect(
      taskDueStateService.dueState(
        { status: TaskStatus.Open, dueOn: "2026-09-20" },
        TODAY,
      ),
    ).toBe(TaskDueState.Overdue);
    expect(
      taskDueStateService.dueState(
        { status: TaskStatus.InProgress, dueOn: "2026-01-01" },
        TODAY,
      ),
    ).toBe(TaskDueState.Overdue);
  });

  it("treats today and the seventh day ahead as due soon, the eighth as none", () => {
    const state = (dueOn: string) =>
      taskDueStateService.dueState({ status: TaskStatus.Open, dueOn }, TODAY);

    expect(state("2026-09-21")).toBe(TaskDueState.DueSoon);
    expect(state("2026-09-28")).toBe(TaskDueState.DueSoon);
    expect(state("2026-09-29")).toBe(TaskDueState.None);
  });

  it("never marks a closed task or an undated task", () => {
    for (const status of [TaskStatus.Done, TaskStatus.Cancelled]) {
      expect(
        taskDueStateService.dueState({ status, dueOn: "2026-01-01" }, TODAY),
      ).toBe(TaskDueState.None);
    }
    expect(
      taskDueStateService.dueState(
        { status: TaskStatus.Open, dueOn: null },
        TODAY,
      ),
    ).toBe(TaskDueState.None);
  });
});

describe("taskDueStateService.businessToday", () => {
  it("uses the business time zone rather than UTC", () => {
    // 22:30 UTC on 20 Sep is already 00:30 on 21 Sep in Berlin (summer time, UTC+2).
    expect(
      taskDueStateService.businessToday(new Date("2026-09-20T22:30:00Z")),
    ).toBe("2026-09-21");
    expect(
      taskDueStateService.businessToday(new Date("2026-09-20T21:30:00Z")),
    ).toBe("2026-09-20");
  });
});

describe("date arithmetic", () => {
  it("adds days across month and year boundaries", () => {
    expect(taskDueStateService.addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(taskDueStateService.addDays("2026-12-31", 7)).toBe("2027-01-07");
  });

  it("counts whole days between two dates", () => {
    expect(taskDueStateService.daysBetween("2026-09-18", "2026-09-21")).toBe(3);
    expect(taskDueStateService.daysBetween("2026-09-21", "2026-09-21")).toBe(0);
  });
});
