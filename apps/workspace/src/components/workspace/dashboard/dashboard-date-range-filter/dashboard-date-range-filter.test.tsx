// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DashboardDateRangeFilter } from "./dashboard-date-range-filter";

const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const labels = {
  group: "Time range",
  from: "From",
  to: "To",
};

describe("DashboardDateRangeFilter", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("pushes the new date_from value into the URL", () => {
    render(
      <DashboardDateRangeFilter
        basePath="/en/dashboard"
        currentQueryString=""
        fromValue="2026-04-21"
        labels={labels}
        toValue="2026-05-21"
      />,
    );

    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2026-04-01" },
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/en/dashboard?date_from=2026-04-01&date_to=2026-05-21",
      { scroll: false },
    );
  });

  it("repairs inverted ranges when the current URL is already inverted", () => {
    render(
      <DashboardDateRangeFilter
        basePath="/de/dashboard"
        currentQueryString="foo=bar&date_from=2026-04-30&date_to=2026-04-01"
        fromValue="2026-04-01"
        labels={labels}
        toValue="2026-04-30"
      />,
    );

    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2026-04-15" },
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/de/dashboard?foo=bar&date_from=2026-04-15&date_to=2026-04-30",
      { scroll: false },
    );
  });

  it("preserves existing query params when updating date_to", () => {
    render(
      <DashboardDateRangeFilter
        basePath="/de/dashboard"
        currentQueryString="foo=bar&date_from=2026-04-01"
        fromValue="2026-04-01"
        labels={labels}
        toValue="2026-05-21"
      />,
    );

    fireEvent.change(screen.getByLabelText("To"), {
      target: { value: "2026-04-30" },
    });

    const [calledHref] = mockRouter.push.mock.calls[0] as [string, unknown];
    const params = new URLSearchParams(calledHref.split("?")[1] ?? "");
    expect(params.get("foo")).toBe("bar");
    expect(params.get("date_from")).toBe("2026-04-01");
    expect(params.get("date_to")).toBe("2026-04-30");
  });

  it("removes the param when an input is cleared", () => {
    render(
      <DashboardDateRangeFilter
        basePath="/en/dashboard"
        currentQueryString="date_from=2026-04-01"
        fromValue="2026-04-01"
        labels={labels}
        toValue="2026-05-21"
      />,
    );

    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "" },
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/en/dashboard?date_to=2026-05-21",
      { scroll: false },
    );
  });
});
