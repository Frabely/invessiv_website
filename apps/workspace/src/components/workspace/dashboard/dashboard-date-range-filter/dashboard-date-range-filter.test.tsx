// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DashboardDateRangeFilter } from "./dashboard-date-range-filter";

const mockRouter = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));

const labels = {
  group: "Time range",
  preset: "Select time range",
  from: "From",
  to: "To",
  options: {
    today: "Today",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    last90Days: "Last 90 days",
    all: "All",
    custom: "Custom",
  },
};

function choosePreset(optionLabel: string) {
  fireEvent.click(screen.getByRole("button", { name: labels.preset }));
  fireEvent.click(screen.getByRole("option", { name: optionLabel }));
}

describe("DashboardDateRangeFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
    mockRouter.push.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function renderFilter(query = "foo=bar") {
    render(
      <DashboardDateRangeFilter
        basePath="/en/dashboard"
        currentQueryString={query}
        fromValue="2026-05-15"
        labels={labels}
        toValue="2026-05-21"
      />,
    );
  }

  it("writes both preset bounds in one navigation and preserves other params", () => {
    renderFilter();
    choosePreset(labels.options.last30Days);
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/en/dashboard?foo=bar&date_from=2026-04-22&date_to=2026-05-21",
      { scroll: false },
    );
  });

  it("uses an explicit range state for All", () => {
    renderFilter("foo=bar&date_from=2026-05-15&date_to=2026-05-21");
    choosePreset(labels.options.all);
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/en/dashboard?foo=bar&range=all",
      { scroll: false },
    );
  });

  it("removes the All marker when selecting a bounded preset", () => {
    render(
      <DashboardDateRangeFilter
        basePath="/en/dashboard"
        currentQueryString="range=all&foo=bar"
        fromValue=""
        labels={labels}
        toValue=""
      />,
    );
    expect(
      screen.getByRole("button", { name: labels.preset }),
    ).toHaveTextContent(labels.options.all);
    choosePreset(labels.options.today);
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/en/dashboard?foo=bar&date_from=2026-05-21&date_to=2026-05-21",
      { scroll: false },
    );
  });
});
