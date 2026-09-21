// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TaskDueLabel } from "./task-due-label";

const TODAY = "2026-09-21";
const content = getCrmTasksDictionary("en");

function renderLabel(
  dueOn: string | null,
  status: TaskStatus = TaskStatus.Open,
) {
  render(
    <TaskDueLabel
      content={content}
      locale="en"
      task={{ dueOn, status }}
      today={TODAY}
    />,
  );
}

describe("TaskDueLabel", () => {
  afterEach(cleanup);

  it("names how long an open task has been overdue, as text", () => {
    renderLabel("2026-09-18");

    expect(screen.getByText("Overdue for 3 days")).toHaveAttribute(
      "data-state",
      "overdue",
    );
  });

  it("uses the singular for a single overdue day", () => {
    renderLabel("2026-09-20");

    expect(screen.getByText("Overdue for 1 day")).toBeInTheDocument();
  });

  it("says today, tomorrow or in n days for tasks that are due soon", () => {
    renderLabel("2026-09-21");
    expect(screen.getByText("Due today")).toBeInTheDocument();
    cleanup();

    renderLabel("2026-09-22");
    expect(screen.getByText("Due tomorrow")).toBeInTheDocument();
    cleanup();

    renderLabel("2026-09-26");
    expect(screen.getByText("Due in 5 days")).toBeInTheDocument();
  });

  it("prints the plain date for a distant or a closed task and stays unmarked", () => {
    renderLabel("2026-12-24");
    expect(screen.getByText(/^Due Dec 24, 2026$/)).not.toHaveAttribute(
      "data-state",
    );
    cleanup();

    renderLabel("2026-09-01", TaskStatus.Done);
    expect(screen.getByText(/^Due Sep 1, 2026$/)).not.toHaveAttribute(
      "data-state",
    );
  });

  it("says so when there is no deadline", () => {
    renderLabel(null);

    expect(screen.getByText("No due date")).toBeInTheDocument();
  });
});
