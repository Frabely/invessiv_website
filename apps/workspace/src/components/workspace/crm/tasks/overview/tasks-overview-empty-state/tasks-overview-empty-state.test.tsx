// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TASKS_EMPTY_STATE_VARIANT_VALUES } from "@/common/constants/crm/list/tasks-empty-state-variants";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TasksOverviewEmptyState } from "./tasks-overview-empty-state";

describe("TasksOverviewEmptyState", () => {
  afterEach(cleanup);

  it.each(["de", "en"] as const)(
    "says something different for each situation in %s",
    (locale) => {
      const content = getCrmTasksDictionary(locale);
      const titles = TASKS_EMPTY_STATE_VARIANT_VALUES.map((variant) => {
        render(
          <TasksOverviewEmptyState
            actionHref="/x"
            content={content}
            variant={variant}
          />,
        );
        const title = screen.getAllByRole("link")[0];
        cleanup();
        return title.textContent;
      });

      expect(new Set(titles).size).toBe(
        TASKS_EMPTY_STATE_VARIANT_VALUES.length,
      );
    },
  );

  it("explains what the overview is for when nothing was ever planned", () => {
    const content = getCrmTasksDictionary("en");

    render(
      <TasksOverviewEmptyState
        actionHref="/en/crm"
        content={content}
        variant="empty"
      />,
    );

    expect(
      screen.getByText(content.overview.empty.description),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.overview.empty.action }),
    ).toHaveAttribute("href", "/en/crm");
  });

  it("offers the way back when filters match nothing and reads as good news when nothing is overdue", () => {
    const content = getCrmTasksDictionary("en");

    render(
      <TasksOverviewEmptyState
        actionHref="/en/crm/tasks"
        content={content}
        variant="no_results"
      />,
    );
    expect(
      screen.getByRole("link", { name: content.overview.noResults.action }),
    ).toBeInTheDocument();
    cleanup();

    render(
      <TasksOverviewEmptyState
        actionHref="/en/crm/tasks"
        content={content}
        variant="nothing_overdue"
      />,
    );
    expect(
      screen.getByText(content.overview.nothingOverdue.title),
    ).toBeInTheDocument();
  });
});
