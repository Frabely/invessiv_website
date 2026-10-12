// @vitest-environment jsdom
import "@/test/portal/dashboard/portal-dashboard-mocks";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  setupPortalDashboardTests,
  portalDashboardTestContext,
} from "@/test/portal/dashboard/portal-dashboard-test-support";
const { mocks, content, CONVERSATION, FILES, FULL_READ, dto, renderDashboard } =
  portalDashboardTestContext();
setupPortalDashboardTests();
describe("PortalDashboard credentials", () => {
  it("shows the credentials widget as a number with its two ways into the dialog", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: new Set([...FULL_READ, Permission.PortalCredentialsRead]),
      cockpitHref: null,
      conversation: CONVERSATION,
      filesOverview: FILES,
      onboarding: null,
      credentials: { count: 3, canWrite: true, configured: true },
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.credentials.title,
    });
    expect(
      within(widget).getByText("3 credentials stored"),
    ).toBeInTheDocument();
    // A dialog on the dashboard, not a page: there is nothing to navigate to.
    expect(within(widget).queryByRole("link")).toBeNull();

    fireEvent.click(
      within(widget).getByRole("button", {
        name: content.widgets.credentials.open,
      }),
    );
    expect(mocks.push).toHaveBeenLastCalledWith(
      expect.stringContaining("widget=credentials"),
      { scroll: false },
    );
    fireEvent.click(
      within(widget).getByRole("button", {
        name: content.widgets.credentials.add,
      }),
    );
    expect(mocks.push).toHaveBeenCalledTimes(2);
  });
  it("offers no add action without the write right and none while encryption is missing", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: new Set([...FULL_READ, Permission.PortalCredentialsRead]),
      cockpitHref: null,
      conversation: CONVERSATION,
      filesOverview: FILES,
      onboarding: null,
      credentials: { count: 0, canWrite: false, configured: true },
    });
    const readOnly = screen.getByRole("region", {
      name: content.widgets.credentials.title,
    });
    expect(
      within(readOnly).getByText(content.widgets.credentials.empty),
    ).toBeInTheDocument();
    expect(
      within(readOnly).queryByRole("button", {
        name: content.widgets.credentials.add,
      }),
    ).toBeNull();
    cleanup();

    renderDashboard({
      dashboard: dto(),
      permissions: new Set([...FULL_READ, Permission.PortalCredentialsRead]),
      cockpitHref: null,
      conversation: CONVERSATION,
      filesOverview: FILES,
      onboarding: null,
      credentials: { count: 0, canWrite: true, configured: false },
    });
    expect(
      screen.getByRole("button", { name: content.widgets.credentials.add }),
    ).toBeDisabled();
  });
  it("shows no credentials widget to the standard role", () => {
    renderDashboard({ dashboard: dto(), permissions: FULL_READ });

    expect(
      screen.queryByRole("region", { name: content.widgets.credentials.title }),
    ).toBeNull();
  });
});
