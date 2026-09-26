// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import PortalCustomerPage, { generateMetadata } from "./page";

const mockRequirePortalReader = vi.hoisted(() => vi.fn());
vi.mock("@/server/portal/auth/require-portal-reader", () => ({
  requirePortalReader: mockRequirePortalReader,
}));

const mockGetPortalCustomerDisplayName = vi.hoisted(() => vi.fn());
vi.mock(
  "@/server/portal/query-handler/get-portal-customer-display-name.query-handler",
  () => ({ getPortalCustomerDisplayName: mockGetPortalCustomerDisplayName }),
);

const ACTOR = {
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: "customer-1",
  personId: "person-uuid-1",
  permissions: new Set([Permission.PortalAccess]),
  projectPermissions: new Map(),
};

describe("PortalCustomerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePortalReader.mockResolvedValue(ACTOR);
  });

  afterEach(cleanup);

  it("renders the active company's display name", async () => {
    mockGetPortalCustomerDisplayName.mockResolvedValue("Nordlicht Coaching");

    render(
      await PortalCustomerPage({
        params: Promise.resolve({ locale: "de", customerId: "customer-1" }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordlicht Coaching" }),
    ).toBeInTheDocument();
  });

  it("returns localized no-index metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", customerId: "customer-1" }),
    });

    expect(metadata.title).toBe("Portal | Workspace");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("returns empty metadata for an unsupported locale instead of throwing", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr", customerId: "customer-1" }),
    });

    expect(metadata).toEqual({});
  });

  it("normalizes the customerId case before resolving the actor", async () => {
    mockGetPortalCustomerDisplayName.mockResolvedValue(null);

    await PortalCustomerPage({
      params: Promise.resolve({ locale: "de", customerId: "CUSTOMER-1" }),
    });

    expect(mockRequirePortalReader).toHaveBeenCalledWith("de", "customer-1");
  });
});
