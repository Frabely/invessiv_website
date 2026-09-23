// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskListRowDto } from "@/common/contracts/crm/task-list-result";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getDashboardDueTasksDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { DueTasksView } from "./due-tasks-view";

const TODAY = "2026-09-21";
const VIEW_ALL_HREF = "/de/crm/tasks?assignee=me&period=due_soon";

function taskRow(
  title: string,
  dueOn: string,
  actionSide: TaskActionSide = TaskActionSide.Internal,
): TaskListRowDto {
  return {
    customerId: "11111111-1111-4111-8111-111111111111",
    customerDisplayName: "Nordlicht GmbH",
    projectTitle: "Relaunch",
    task: {
      id: `id-${title}`,
      projectId: "33333333-3333-4333-8333-333333333333",
      title,
      description: "",
      status: TaskStatus.Open,
      actionSide,
      visibleToCustomer: false,
      assigneeMemberId: "77777777-7777-4777-8777-777777777777",
      dueOn,
      completedAt: null,
      completedByMemberId: null,
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  };
}

function renderView(rows: TaskListRowDto[]) {
  return render(
    <DueTasksView
      labels={getDashboardDueTasksDictionary("de")}
      locale="de"
      rows={rows}
      tasksContent={getCrmTasksDictionary("de")}
      today={TODAY}
      viewAllHref={VIEW_ALL_HREF}
    />,
  );
}

describe("DueTasksView", () => {
  afterEach(() => {
    cleanup();
  });

  it("puts overdue tasks in their own group before the soon-due ones", () => {
    renderView([
      taskRow("Freigabe einholen", "2026-09-18"),
      taskRow("Texte liefern", "2026-09-22"),
      taskRow("Logo abstimmen", "2026-09-25"),
    ]);

    const groups = screen.getAllByRole("heading", { level: 3 });
    expect(groups.map((heading) => heading.textContent)).toEqual([
      "Überfällig11 Aufgaben",
      "In den nächsten 7 Tagen22 Aufgaben",
    ]);

    const overdue = screen.getByRole("region", { name: /Überfällig/ });
    expect(within(overdue).getByText("Freigabe einholen")).toBeInTheDocument();
    expect(
      within(overdue).getByText("Seit 3 Tagen überfällig"),
    ).toBeInTheDocument();

    const soon = screen.getByRole("region", {
      name: /In den nächsten 7 Tagen/,
    });
    expect(
      within(soon)
        .getAllByRole("listitem")
        .map((item) => within(item).getByText(/Texte|Logo/).textContent),
    ).toEqual(["Texte liefern", "Logo abstimmen"]);
    expect(within(soon).getByText("Morgen fällig")).toBeInTheDocument();
  });

  it("shows customer and project and marks only tasks waiting on the customer", () => {
    renderView([
      taskRow("Zugang schicken", "2026-09-22", TaskActionSide.Customer),
      taskRow("Entwurf bauen", "2026-09-23"),
    ]);

    expect(screen.getAllByText("Nordlicht GmbH · Relaunch")).toHaveLength(2);
    expect(screen.getAllByText("Kunde ist dran")).toHaveLength(1);
    expect(screen.queryByText("Wir sind dran")).not.toBeInTheDocument();
  });

  it("leaves out a group without tasks", () => {
    renderView([taskRow("Texte liefern", "2026-09-22")]);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(screen.queryByText("Überfällig")).not.toBeInTheDocument();
  });

  it("links the full overview with the same filters", () => {
    renderView([taskRow("Texte liefern", "2026-09-22")]);

    expect(
      screen.getByRole("link", {
        name: "Alle eigenen fälligen Aufgaben in der Aufgabenübersicht öffnen",
      }),
    ).toHaveAttribute("href", VIEW_ALL_HREF);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Deine fälligen Aufgaben",
      }),
    ).toBeInTheDocument();
  });
});
