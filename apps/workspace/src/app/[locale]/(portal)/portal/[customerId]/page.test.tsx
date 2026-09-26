// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalDashboardProps } from "@/components/portal/dashboard/portal-dashboard/portal-dashboard";
import PortalCustomerPage, { generateMetadata } from "./page";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requirePortalReader: vi.fn(),
  getPortalDashboard: vi.fn(),
  dashboardProps: vi.fn(),
}));

vi.mock("@/server/portal/auth/require-portal-reader", () => ({
  requirePortalReader: mocks.requirePortalReader,
}));
vi.mock(
  "@/server/portal/query-handler/get-portal-dashboard.query-handler",
  () => ({ getPortalDashboard: mocks.getPortalDashboard }),
);
vi.mock(
  "@/components/portal/dashboard/portal-dashboard/portal-dashboard",
  () => ({
    PortalDashboard: (props: PortalDashboardProps) => {
      mocks.dashboardProps(props);
      return <div data-testid="dashboard" />;
    },
  }),
);

const ACTOR = {
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: "customer-1",
  personId: "person-uuid-1",
  permissions: new Set([Permission.PortalAccess, Permission.PortalTasksRead]),
  projectPermissions: new Map(),
};

function dashboard(
  overrides: Partial<PortalDashboardDto> = {},
): PortalDashboardDto {
  return {
    customer: { displayName: "Nordlicht Coaching" },
    contact: null,
    projects: [],
    completedProjects: [],
    customerTasks: [],
    ourTasks: [],
    capabilities: { canCompleteTasks: false, isOwnerView: false },
    ...overrides,
  };
}

async function renderPage(customerId = "customer-1") {
  render(
    await PortalCustomerPage({
      params: Promise.resolve({ locale: "de", customerId }),
    }),
  );
  return mocks.dashboardProps.mock.calls.at(-1)![0] as PortalDashboardProps;
}

describe("PortalCustomerPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.requirePortalReader.mockResolvedValue(ACTOR);
    mocks.getPortalDashboard.mockResolvedValue(dashboard());
  });

  afterEach(cleanup);

  it("renders a visually hidden heading with the company name", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Übersicht – Nordlicht Coaching",
      }),
    ).toBeInTheDocument();
  });

  it("passes only widgets the reader may see and that have content", async () => {
    const props = await renderPage();
    const keys = props.widgets.map((entry) => entry.key);

    expect(keys).toContain(PortalWidgetKey.CustomerTasks);
    expect(keys).not.toContain(PortalWidgetKey.Project);
    expect(keys).not.toContain(PortalWidgetKey.Contact);
    expect(keys).not.toContain(PortalWidgetKey.CompletedProjects);
    expect(props.cockpitHref).toBeNull();
  });

  it("gives the owner view a cockpit link for disabled actions", async () => {
    mocks.getPortalDashboard.mockResolvedValue(
      dashboard({
        capabilities: { canCompleteTasks: false, isOwnerView: true },
      }),
    );

    const props = await renderPage();

    expect(props.cockpitHref).toBe("/de/crm?cockpit=customer-1");
  });

  it("normalizes the customerId case before resolving the reader", async () => {
    await renderPage("CUSTOMER-1");

    expect(mocks.requirePortalReader).toHaveBeenCalledWith("de", "customer-1");
  });

  it("returns localized no-index metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", customerId: "customer-1" }),
    });

    expect(metadata.title).toBe("Overview | Invessiv");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("returns empty metadata for an unsupported locale instead of throwing", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr", customerId: "customer-1" }),
    });

    expect(metadata).toEqual({});
  });
});
