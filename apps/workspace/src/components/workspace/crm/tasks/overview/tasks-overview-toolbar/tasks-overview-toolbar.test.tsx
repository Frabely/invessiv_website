// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TaskListFilterOptions } from "@/common/contracts/crm/task-list-filter-options";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TasksOverviewToolbar } from "./tasks-overview-toolbar";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

const BASE = "/en/crm/tasks";
const CUSTOMER_A = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_B = "22222222-2222-4222-8222-222222222222";
const PROJECT_A1 = "33333333-3333-4333-8333-333333333333";
const PROJECT_B1 = "44444444-4444-4444-8444-444444444444";
const MEMBER_ID = "77777777-7777-4777-8777-777777777777";
const content = getCrmTasksDictionary("en");
const toolbar = content.overview.toolbar;

const FILTER_OPTIONS: TaskListFilterOptions = {
  customers: [
    { id: CUSTOMER_A, displayName: "Nordlicht GmbH" },
    { id: CUSTOMER_B, displayName: "Sonnenhof" },
  ],
  projects: [
    { customerId: CUSTOMER_A, id: PROJECT_A1, title: "Relaunch" },
    { customerId: CUSTOMER_B, id: PROJECT_B1, title: "Shop" },
  ],
};

function renderToolbar(
  overrides: Partial<TaskListFilters> = {},
  hasActiveFilters = false,
) {
  render(
    <TasksOverviewToolbar
      basePath={BASE}
      content={content}
      filterOptions={FILTER_OPTIONS}
      filters={{ ...DEFAULT_TASK_LIST_FILTERS, ...overrides }}
      hasActiveFilters={hasActiveFilters}
      members={[{ id: MEMBER_ID, displayName: "Ada Lovelace", active: true }]}
    />,
  );
}

function chip(group: string, label: string) {
  const toolbarGroup = screen.getByRole("toolbar", { name: group });
  return Array.from(toolbarGroup.querySelectorAll("button")).find(
    (button) => button.textContent === label,
  ) as HTMLButtonElement;
}

function choose(selectAriaLabel: string, optionName: string) {
  fireEvent.click(screen.getByRole("button", { name: selectAriaLabel }));
  fireEvent.click(screen.getByRole("option", { name: optionName }));
}

describe("TasksOverviewToolbar", () => {
  beforeEach(() => {
    mocks.push.mockReset();
  });
  afterEach(cleanup);

  it("shows every facet chip as a badge with its own tone", () => {
    renderToolbar();

    const tone = (group: string, label: string) =>
      chip(group, label)
        .querySelector("[data-tone]")
        ?.getAttribute("data-tone");

    expect(tone(toolbar.period.ariaLabel, toolbar.period.options.overdue)).toBe(
      "danger",
    );
    expect(tone(toolbar.status.ariaLabel, toolbar.status.options.done)).toBe(
      "success",
    );
    expect(tone(toolbar.side.ariaLabel, content.actionSide.customer)).toBe(
      "warning",
    );
    expect(tone(toolbar.assignee.ariaLabel, toolbar.assignee.me)).toBe(
      "primary",
    );
  });

  it("writes a picked period into the URL without a scroll jump", () => {
    renderToolbar();

    fireEvent.click(
      chip(toolbar.period.ariaLabel, toolbar.period.options.overdue),
    );

    expect(mocks.push).toHaveBeenCalledWith(`${BASE}?period=overdue`, {
      scroll: false,
    });
  });

  it("goes back to page one when a filter changes", () => {
    renderToolbar({ page: 4 });

    fireEvent.click(
      chip(toolbar.status.ariaLabel, toolbar.status.options.done),
    );

    expect(mocks.push.mock.calls[0][0]).toBe(`${BASE}?status=done`);
  });

  it("keeps the other filters when one is changed", () => {
    renderToolbar({ actionSide: "customer" });

    fireEvent.click(chip(toolbar.assignee.ariaLabel, toolbar.assignee.me));

    const params = new URLSearchParams(
      mocks.push.mock.calls[0][0].split("?")[1],
    );
    expect(params.get("side")).toBe("customer");
    expect(params.get("assignee")).toBe("me");
  });

  it("offers every member as an assignee choice", () => {
    renderToolbar();

    fireEvent.click(chip(toolbar.assignee.ariaLabel, "Ada Lovelace"));

    expect(mocks.push).toHaveBeenCalledWith(`${BASE}?assignee=${MEMBER_ID}`, {
      scroll: false,
    });
  });

  it("returns to the default when the all option is picked again", () => {
    renderToolbar({ period: "overdue" });

    fireEvent.click(chip(toolbar.period.ariaLabel, toolbar.period.options.all));

    expect(mocks.push).toHaveBeenCalledWith(BASE, { scroll: false });
  });

  it("toggles the closed-projects switch through the URL", () => {
    renderToolbar();

    fireEvent.click(
      screen.getByRole("checkbox", { name: toolbar.closedProjects }),
    );

    expect(mocks.push).toHaveBeenCalledWith(`${BASE}?closedProjects=true`, {
      scroll: false,
    });
  });

  it("picks a customer from a select and clears the project that belonged to another one", () => {
    renderToolbar({ customerId: CUSTOMER_A, projectId: PROJECT_A1 });

    choose(toolbar.customer.ariaLabel, "Sonnenhof");

    const params = new URLSearchParams(
      mocks.push.mock.calls[0][0].split("?")[1],
    );
    expect(params.get("customer")).toBe(CUSTOMER_B);
    expect(params.has("project")).toBe(false);
  });

  it("offers only the projects of the chosen customer", () => {
    renderToolbar({ customerId: CUSTOMER_A });

    fireEvent.click(
      screen.getByRole("button", { name: toolbar.project.ariaLabel }),
    );

    expect(
      screen.getByRole("option", { name: "Relaunch" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Shop" }),
    ).not.toBeInTheDocument();
  });

  it("offers a reset only while something narrows the list", () => {
    renderToolbar();
    const reset = () =>
      screen.getByRole("button", { name: toolbar.actions.reset });
    expect(reset()).toBeDisabled();
    cleanup();

    renderToolbar({ period: "overdue" }, true);
    expect(reset()).toBeEnabled();
    fireEvent.click(reset());

    expect(mocks.push).toHaveBeenCalledWith(BASE, { scroll: false });
  });

  it("keeps the native filter disclosure closed until requested", () => {
    renderToolbar();
    const filters = document.querySelector("details") as HTMLDetailsElement;
    expect(filters).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText(toolbar.ariaLabel));
    expect(filters).toHaveAttribute("open");

    fireEvent.click(screen.getByText(toolbar.ariaLabel));
    expect(filters).not.toHaveAttribute("open");
  });
});
