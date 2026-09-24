// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalEntryPage, { generateMetadata } from "./page";

const mockAuth = vi.hoisted(() => vi.fn());
const mockListPortalMembershipsForUser = vi.hoisted(() => vi.fn());
const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
);
const mockRedirect = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));
const mockIsFeatureEnabled = vi.hoisted(() => vi.fn());
vi.mock("@/config/feature-flags", () => ({
  FeatureFlag: { Portal: "portal" },
  isFeatureEnabled: mockIsFeatureEnabled,
}));
vi.mock(
  "@/server/portal/query-handler/list-portal-memberships-for-user.query-handler",
  () => ({
    listPortalMembershipsForUser: mockListPortalMembershipsForUser,
  }),
);
vi.mock(
  "@/components/portal/portal-company-picker/portal-company-picker",
  () => ({
    PortalCompanyPicker: ({
      companies,
    }: {
      companies: { customerId: string; displayName: string }[];
    }) => (
      <ul>
        {companies.map((c) => (
          <li key={c.customerId}>{c.displayName}</li>
        ))}
      </ul>
    ),
  }),
);

describe("PortalEntryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFeatureEnabled.mockReturnValue(true);
  });

  afterEach(cleanup);

  it("answers 404 before any auth check when the flag is off", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    await expect(
      PortalEntryPage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("rejects unsupported locales", async () => {
    await expect(
      PortalEntryPage({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("redirects to sign-in when there is no Clerk session", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(
      PortalEntryPage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("REDIRECT:/de/sign-in?redirect_url=%2Fde%2Fportal");
  });

  it("answers 404 with no active portal membership", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
    mockListPortalMembershipsForUser.mockResolvedValue([]);

    await expect(
      PortalEntryPage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("redirects straight to the single active company", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
    mockListPortalMembershipsForUser.mockResolvedValue([
      { customerId: "customer-1", displayName: "Nordlicht Coaching" },
    ]);

    await expect(
      PortalEntryPage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("REDIRECT:/de/portal/customer-1");
  });

  it("renders a picker with no silent default when several companies are active", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
    mockListPortalMembershipsForUser.mockResolvedValue([
      { customerId: "customer-1", displayName: "Nordlicht Coaching" },
      { customerId: "customer-2", displayName: "Südwind Beratung" },
    ]);

    render(
      await PortalEntryPage({
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByText("Nordlicht Coaching")).toBeInTheDocument();
    expect(screen.getByText("Südwind Beratung")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns localized no-index metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.title).toBe("Portal | Workspace");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
