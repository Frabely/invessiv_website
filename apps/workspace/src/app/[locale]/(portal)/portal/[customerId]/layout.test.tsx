// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import PortalCustomerLayout from "./layout";

vi.mock("server-only", () => ({}));

const mockRequirePortalReader = vi.hoisted(() => vi.fn());
vi.mock("@/server/portal/auth/require-portal-reader", () => ({
  requirePortalReader: mockRequirePortalReader,
}));

const mockGetPortalCustomerDisplayName = vi.hoisted(() => vi.fn());
vi.mock(
  "@/server/portal/query-handler/get-portal-customer-display-name.query-handler",
  () => ({ getPortalCustomerDisplayName: mockGetPortalCustomerDisplayName }),
);

const mockGetPortalGreetingName = vi.hoisted(() => vi.fn());
vi.mock(
  "@/server/portal/query-handler/get-portal-greeting-name.query-handler",
  () => ({ getPortalGreetingName: mockGetPortalGreetingName }),
);

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
    greeting,
    nav,
    notice,
    switcher,
  }: {
    children: ReactNode;
    greeting: string | null;
    nav: ReactNode;
    notice: ReactNode;
    switcher: ReactNode;
  }) => (
    <div>
      <div data-testid="greeting-slot">{greeting}</div>
      <div data-testid="notice-slot">{notice}</div>
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
    mockRequirePortalReader.mockResolvedValue(ACTOR);
    mockListPortalMembershipsForUserId.mockResolvedValue([
      { customerId: "customer-1", displayName: "Nordlicht Coaching" },
    ]);
    mockListPermittedPortalNavItems.mockReturnValue([]);
    mockGetPortalGreetingName.mockResolvedValue(null);
  });

  afterEach(cleanup);

  it("resolves the actor for this customer and renders the shell with the company switcher", async () => {
    render(
      await PortalCustomerLayout({
        children: <p>Company content</p>,
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(mockRequirePortalReader).toHaveBeenCalledWith("de", "customer-1");
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

    expect(mockRequirePortalReader).toHaveBeenCalledWith("de", "customer-1");
  });

  it("shows only the company name and the owner banner in the owner view", async () => {
    mockRequirePortalReader.mockResolvedValue(
      createPortalOwnerView({
        userId: "owner-user-uuid",
        customerId: "customer-1",
        permissions: new Set([Permission.PortalAccess]),
      }),
    );
    mockGetPortalCustomerDisplayName.mockResolvedValue("Kanzlei Müller");

    render(
      await PortalCustomerLayout({
        children: <p>Company content</p>,
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(mockListPortalMembershipsForUserId).not.toHaveBeenCalled();
    expect(screen.getByTestId("switcher-slot")).toHaveTextContent(
      "Kanzlei Müller",
    );
    expect(screen.getByTestId("notice-slot")).toHaveTextContent(
      "Portalansicht von Kanzlei Müller",
    );
    expect(screen.getByRole("link", { name: "Im CRM öffnen" })).toHaveAttribute(
      "href",
      "/de/crm?cockpit=customer-1",
    );
  });

  it("greets the contact by first name in the header", async () => {
    mockGetPortalGreetingName.mockResolvedValue("Sam");

    render(
      await PortalCustomerLayout({
        children: <p>Company content</p>,
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(screen.getByTestId("greeting-slot")).toHaveTextContent("Hallo Sam");
  });

  it("shows no greeting without a first name", async () => {
    render(
      await PortalCustomerLayout({
        children: <p>Company content</p>,
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(screen.getByTestId("greeting-slot")).toBeEmptyDOMElement();
  });

  it("renders no banner for a customer contact", async () => {
    render(
      await PortalCustomerLayout({
        children: <p>Company content</p>,
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(screen.getByTestId("notice-slot")).toBeEmptyDOMElement();
    expect(mockGetPortalCustomerDisplayName).not.toHaveBeenCalled();
  });
});
