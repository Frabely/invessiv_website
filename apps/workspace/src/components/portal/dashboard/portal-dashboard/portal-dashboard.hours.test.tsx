// @vitest-environment jsdom
import "@/test/portal/dashboard/portal-dashboard-mocks";
import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getPortalHoursDictionary } from "@/i18n/dictionaries/portal";
import {
  setupPortalDashboardTests,
  portalDashboardTestContext,
} from "@/test/portal/dashboard/portal-dashboard-test-support";
const { mocks, content, HOURS_READ, HOURS, dto, renderDashboard } =
  portalDashboardTestContext();
setupPortalDashboardTests();
describe("PortalDashboard hours", () => {
  it("has no hours widget without hours to show", () => {
    renderDashboard();

    expect(
      screen.queryByRole("region", { name: content.widgets.hours.title }),
    ).toBeNull();
  });
  it("shows the remaining hours as a real widget, with the selected project", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: HOURS_READ,
      cockpitHref: null,
      conversation: null,
      filesOverview: null,
      onboarding: null,
      credentials: null,
      hours: HOURS,
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.hours.title,
    });
    expect(widget).not.toHaveAttribute("data-mock");
    expect(within(widget).getByText("1:30")).toBeInTheDocument();
    expect(within(widget).getByText("8:30 of 10:00 used")).toBeInTheDocument();
    expect(
      within(widget).getByText("In this project: 2:30 left"),
    ).toBeInTheDocument();
  });
  it("names an overdrawn balance in words, not only by colour", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: HOURS_READ,
      cockpitHref: null,
      conversation: null,
      filesOverview: null,
      onboarding: null,
      credentials: null,
      hours: {
        ...HOURS,
        balance: {
          purchasedMinutes: 600,
          usedMinutes: 660,
          remainingMinutes: -60,
          unassignedMinutes: 0,
        },
        projects: [{ ...HOURS.projects[0]!, remainingMinutes: -60 }],
      },
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.hours.title,
    });
    expect(widget).toHaveTextContent("1:00 over your hours");
    expect(
      within(widget).getByText("In this project: 1:00 more used than assigned"),
    ).toBeInTheDocument();
  });
  it("opens the hours dialog from the URL and clears its filter when closing", () => {
    mocks.search.value = "widget=hours&hoursProject=project-1";
    renderDashboard({
      dashboard: dto(),
      permissions: HOURS_READ,
      cockpitHref: null,
      conversation: null,
      filesOverview: null,
      onboarding: null,
      credentials: null,
      hours: {
        ...HOURS,
        canReadEntries: false,
      },
    });

    const dialog = screen.getByRole("dialog", {
      name: getPortalHoursDictionary("en").dialog.title,
    });
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: getPortalHoursDictionary("en").dialog.close,
      }),
    );

    expect(mocks.replace).toHaveBeenLastCalledWith("/en/portal/customer-1", {
      scroll: false,
    });
  });
});
