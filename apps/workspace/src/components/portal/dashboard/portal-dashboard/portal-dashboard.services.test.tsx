// @vitest-environment jsdom
import "@/test/portal/dashboard/portal-dashboard-mocks";
import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  setupPortalDashboardTests,
  portalDashboardTestContext,
} from "@/test/portal/dashboard/portal-dashboard-test-support";
const {
  mocks,
  content,
  SERVICES_READ,
  serviceRequestsContent,
  SERVICES,
  OPEN_REQUEST,
  dto,
  renderDashboard,
} = portalDashboardTestContext();
setupPortalDashboardTests();
describe("PortalDashboard services", () => {
  it("has no service request widget without portal.services.read", () => {
    renderDashboard();

    expect(
      screen.queryByRole("region", {
        name: content.widgets.serviceRequest.title,
      }),
    ).toBeNull();
  });
  it("shows the service request widget as a real card that opens its dialog", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: SERVICES_READ,
      cockpitHref: null,
      conversation: null,
      filesOverview: null,
      onboarding: null,
      credentials: null,
      hours: null,
      services: SERVICES,
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.serviceRequest.title,
    });
    expect(widget).not.toHaveAttribute("data-mock");
    expect(screen.queryByText("Coming soon")).toBeNull();
    expect(
      within(widget).getByText(content.widgets.serviceRequest.benefit),
    ).toBeInTheDocument();
    expect(within(widget).queryByText(/in progress/)).toBeNull();

    fireEvent.click(
      within(widget).getByRole("button", {
        name: content.widgets.serviceRequest.open,
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/en/portal/customer-1?widget=serviceRequest",
      { scroll: false },
    );
  });
  it("names open requests and the status of the newest one as text", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: SERVICES_READ,
      cockpitHref: null,
      conversation: null,
      filesOverview: null,
      onboarding: null,
      credentials: null,
      hours: null,
      services: {
        ...SERVICES,
        requests: [
          OPEN_REQUEST,
          {
            ...OPEN_REQUEST,
            id: "request-2",
            status: ServiceRequestStatus.Accepted,
          },
        ],
      },
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.serviceRequest.title,
    });
    expect(within(widget).getByText("1 request in progress")).toBeVisible();
    expect(
      within(widget).getByText("Latest: “Additional page” – Quote on its way"),
    ).toBeVisible();
  });
  it("opens the request dialog on the service named in the URL and drops it on close", () => {
    mocks.search.value = "widget=serviceRequest&service=service-1";
    renderDashboard({
      dashboard: dto(),
      permissions: SERVICES_READ,
      cockpitHref: null,
      conversation: null,
      filesOverview: null,
      onboarding: null,
      credentials: null,
      hours: null,
      services: SERVICES,
    });

    const dialog = screen.getByRole("dialog", {
      name: serviceRequestsContent.dialog.title,
    });
    expect(
      within(dialog).getByRole("heading", { name: "Additional page" }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: serviceRequestsContent.dialog.close,
      }),
    );
    expect(mocks.replace).toHaveBeenLastCalledWith("/en/portal/customer-1", {
      scroll: false,
    });
  });
  it("reloads through a navigation after sending, so the list is not left stale", async () => {
    mocks.createRequest.mockResolvedValue({ ok: true, value: true });
    mocks.search.value = "widget=serviceRequest&service=service-1";
    renderDashboard({
      dashboard: dto(),
      permissions: SERVICES_READ,
      cockpitHref: null,
      conversation: null,
      filesOverview: null,
      onboarding: null,
      credentials: null,
      hours: null,
      services: SERVICES,
    });
    const dialog = screen.getByRole("dialog", {
      name: serviceRequestsContent.dialog.title,
    });

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: serviceRequestsContent.form.submit,
      }),
    );

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
    // The selection leaves the URL by a router navigation, never by a bare history write that
    // would leave the router's tree on the old query.
    expect(mocks.replace).toHaveBeenCalledWith(
      "/en/portal/customer-1?widget=serviceRequest",
      { scroll: false },
    );
    expect(mocks.replace.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.refresh.mock.invocationCallOrder[0]!,
    );
    expect(
      await within(dialog).findByText(serviceRequestsContent.sent.title),
    ).toBeInTheDocument();
  });
  it("lets the owner view read the catalog but points it to the CRM", () => {
    renderDashboard({
      dashboard: dto({
        capabilities: {
          canCompleteTasks: false,
          canCreateTasks: false,
          isOwnerView: true,
        },
      }),
      permissions: SERVICES_READ,
      cockpitHref: "/en/crm?customer=customer-1",
      conversation: null,
      filesOverview: null,
      onboarding: null,
      credentials: null,
      hours: null,
      services: { ...SERVICES, canRequest: false },
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.serviceRequest.title,
    });
    expect(
      within(widget).getByText(content.widgets.serviceRequest.ownerHint),
    ).toBeInTheDocument();
    const requestButton = within(widget).getByRole("button", {
      name: content.widgets.serviceRequest.open,
    });
    expect(requestButton).toBeDisabled();
    fireEvent.click(requestButton);
    expect(mocks.push).not.toHaveBeenCalled();
    expect(
      within(widget).getByRole("link", {
        name: content.widgets.serviceRequest.ownerLink,
      }),
    ).toHaveAttribute("href", "/en/crm?customer=customer-1");
  });
});
