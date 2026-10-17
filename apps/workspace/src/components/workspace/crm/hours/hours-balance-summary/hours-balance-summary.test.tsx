// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { project } from "@/common/patterns/crm/hours/hours-test-fixtures";
import { getCrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { HoursBalanceSummary } from "./hours-balance-summary";

afterEach(cleanup);
const content = getCrmHoursDictionary("de").balance;

describe("HoursBalanceSummary", () => {
  it("shows open hours and project overruns separately even with a balanced overall stock", () => {
    const { container } = render(
      <HoursBalanceSummary
        balance={{
          purchasedMinutes: 600,
          usedMinutes: 600,
          allocatedMinutes: 600,
          freeMinutes: 0,
          remainingMinutes: 0,
          goodwillMinutes: 0,
        }}
        content={content}
        projects={[
          project({
            usedMinutes: 360,
            remainingMinutes: -60,
            releasableMinutes: 0,
          }),
          project({
            projectId: "other",
            usedMinutes: 240,
            remainingMinutes: 60,
            releasableMinutes: 60,
          }),
        ]}
      />,
    );

    const figures = screen.getByLabelText(content.label);
    expect(figures).toHaveTextContent("Zugewiesen10:00");
    expect(figures).toHaveTextContent("In Projekten offen1:00");
    expect(figures).toHaveTextContent("Projektüberzug1:00");
    expect(figures).toHaveTextContent("Rest0:00");
    const chart = container.querySelector('svg[viewBox="0 0 100 1"]');
    expect(chart).toHaveAttribute("aria-hidden", "true");
    expect(
      Array.from(chart!.querySelectorAll("rect")).map((rect) =>
        rect.getAttribute("data-kind"),
      ),
    ).toEqual(["used", "over", "open"]);
  });

  it("keeps goodwill visible as text without counting it as consumption in the chart", () => {
    const { container } = render(
      <HoursBalanceSummary
        balance={{
          purchasedMinutes: 0,
          usedMinutes: 0,
          allocatedMinutes: 0,
          freeMinutes: 0,
          remainingMinutes: 0,
          goodwillMinutes: 15,
        }}
        content={content}
        projects={[
          project({
            allocatedMinutes: 0,
            usedMinutes: 0,
            goodwillMinutes: 15,
            remainingMinutes: 0,
            releasableMinutes: 0,
          }),
        ]}
      />,
    );

    expect(screen.getByLabelText(content.label)).toHaveTextContent(
      "Kulanz0:15",
    );
    expect(screen.queryByText(content.over)).toBeNull();
    const chart = container.querySelector('svg[viewBox="0 0 100 1"]');
    expect(chart).toBeInTheDocument();
    expect(chart!.querySelector("rect")).toBeNull();
  });
});
