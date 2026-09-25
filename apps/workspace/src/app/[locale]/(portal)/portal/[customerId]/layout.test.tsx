// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import PortalCustomerLayout from "./layout";

const mockRequirePortalActor = vi.hoisted(() => vi.fn());
vi.mock("@/server/portal/auth/require-portal-actor", () => ({
  requirePortalActor: mockRequirePortalActor,
}));

const mockListPortalMembershipsForUserId = vi.hoisted(() => vi.fn());
vi.mock(
  "@/server/portal/query-handler/list-portal-memberships-for-user-id.query-handler",
  () => ({
    listPortalMembershipsForUserId: mockListPortalMembershipsForUserId,
  }),
);

const mockListPermittedPortalNavItems = vi.hoisted(() => vi.fn());
vi.mock("@/common/patterns/portal/list-permitted-portal-nav-items", () => ({
  listPermittedPortalNavItems: mockListPermittedPortalNavItems,
}));

vi.mock("@/components/portal/portal-shell/portal-shell", () => ({
  PortalShell: ({
    children,
    nav,
    switcher,
  }: {
    children: ReactNode;
    nav: ReactNode;
    switcher: ReactNode;
  }) => (
    <div>
      <div data-testid="switcher-slot">{switcher}</div>
      <div data-testid="nav-slot">{nav}</div>
      {children}
    </div>
  ),
}));

vi.mock("@/components/portal/customer-switcher/customer-switcher", () => ({
  CustomerSwitcher: ({
    companies,
  }: {
    companies: { customerId: string; displayName: string }[];
  }) => <span>{companies.map((c) => c.displayName).join(", ")}</span>,
}));

const ACTOR = {
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: "customer-1",
  personId: "person-uuid-1",
  permissions: new Set([Permission.PortalAccess]),
  projectPermissions: new Map(),
};

describe("PortalCustomerLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePortalActor.mockResolvedValue(ACTOR);
    mockListPortalMembershipsForUserId.mockResolvedValue([
      { customerId: "customer-1", displayName: "Nordlicht Coaching" },
    ]);
    mockListPermittedPortalNavItems.mockReturnValue([]);
  });

  afterEach(cleanup);

  it("resolves the actor for this customer and renders the shell with the company switcher", async () => {
    render(
      await PortalCustomerLayout({
        children: <p>Company content</p>,
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(mockRequirePortalActor).toHaveBeenCalledWith("de", "customer-1");
    expect(mockListPortalMembershipsForUserId).toHaveBeenCalledWith(
      "user-uuid-1",
    );
    expect(screen.getByText("Nordlicht Coaching")).toBeInTheDocument();
    expect(screen.getByText("Company content")).toBeInTheDocument();
  });

  it("renders no nav slot content while nothing is permitted", async () => {
    render(
      await PortalCustomerLayout({
        children: <p>Company content</p>,
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(screen.getByTestId("nav-slot")).toBeEmptyDOMElement();
  });

  it("renders a link for every permitted nav item", async () => {
    mockListPermittedPortalNavItems.mockReturnValue([
      {
        section: PortalSection.Projects,
        labelKey: "projects",
        requiredPermission: Permission.PortalAccess,
      },
    ]);

    render(
      await PortalCustomerLayout({
        children: <p>Company content</p>,
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(mockListPermittedPortalNavItems).toHaveBeenCalledWith(
      ACTOR.permissions,
    );
    expect(screen.getByRole("link", { name: "Projekte" })).toHaveAttribute(
      "href",
      "/de/portal/customer-1/projects",
    );
  });

  it("normalizes the customerId case before resolving the actor", async () => {
    await PortalCustomerLayout({
      children: <p>Company content</p>,
      params: Promise.resolve({
        locale: "de",
        customerId: "CUSTOMER-1",
      }),
    });

    expect(mockRequirePortalActor).toHaveBeenCalledWith("de", "customer-1");
  });
});
