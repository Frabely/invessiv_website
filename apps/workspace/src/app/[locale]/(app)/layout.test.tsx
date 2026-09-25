// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import WorkspaceLayout from "./layout";

const mockGetAuthentication = vi.hoisted(() => vi.fn());
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

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
}));

vi.mock("@/lib/auth/permissions", () => ({
  getWorkspaceAuthenticationForRender: mockGetAuthentication,
}));

const mockHasPortalAccessForUserId = vi.hoisted(() => vi.fn());
vi.mock(
  "@/server/workspace/auth/query-handler/has-portal-access-for-user-id.query-handler",
  () => ({
    hasPortalAccessForUserId: mockHasPortalAccessForUserId,
  }),
);

vi.mock("@/components/workspace/workspace-shell/workspace-shell", () => ({
  WorkspaceShell: ({
    children,
    permittedAreas,
    portalHref,
  }: {
    children: ReactNode;
    permittedAreas: readonly string[];
    portalHref?: string | null;
  }) => (
    <main data-areas={permittedAreas.join(",")} data-portal-href={portalHref}>
      {children}
    </main>
  ),
}));

function authorizedWith(...permissions: Permission[]) {
  return {
    status: WorkspaceAuthStatus.Authorized,
    actor: {
      userId: "user-id",
      workspaceMemberId: "member-id",
      permissions: new Set(permissions),
      customerPermissions: new Map(),
      projectPermissions: new Map(),
    },
  };
}

describe("WorkspaceLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPortalAccessForUserId.mockResolvedValue(false);
  });

  afterEach(cleanup);

  it("redirects an authenticated non-member to the approval status", async () => {
    mockGetAuthentication.mockResolvedValue({
      status: WorkspaceAuthStatus.NotMember,
    });

    await expect(
      WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    ).rejects.toThrow("REDIRECT:/de");
  });

  it("redirects an inactive member to the access status", async () => {
    mockGetAuthentication.mockResolvedValue({
      status: WorkspaceAuthStatus.Inactive,
    });

    await expect(
      WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "en" }),
      }),
    ).rejects.toThrow("REDIRECT:/en");
  });

  it("redirects a member without any accessible area to the permission status", async () => {
    mockGetAuthentication.mockResolvedValue(authorizedWith());

    await expect(
      WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "en" }),
      }),
    ).rejects.toThrow("REDIRECT:/en");
  });

  it("renders protected content when at least one area is accessible", async () => {
    mockGetAuthentication.mockResolvedValue(
      authorizedWith(Permission.LeadsRead),
    );

    render(
      await WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("data-areas", "leads");
  });

  it("renders CRM navigation for a member with only scoped customer access", async () => {
    const authentication = authorizedWith();
    authentication.actor.customerPermissions = new Map([
      ["customer-1", new Set([Permission.CustomersRead])],
    ]);
    mockGetAuthentication.mockResolvedValue(authentication);

    render(
      await WorkspaceLayout({
        children: <p>Scoped CRM content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByRole("main")).toHaveAttribute("data-areas", "crm");
  });

  it("keeps unauthenticated visitors in the sign-in flow", async () => {
    mockGetAuthentication.mockResolvedValue({
      status: WorkspaceAuthStatus.Unauthenticated,
    });

    await expect(
      WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    ).rejects.toThrow("REDIRECT:/de/sign-in?redirect_url=%2Fde");
  });

  it("fails closed when authorization is unavailable", async () => {
    mockGetAuthentication.mockResolvedValue({
      status: WorkspaceAuthStatus.Unavailable,
    });

    await expect(
      WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    ).rejects.toThrow("Workspace authorization is unavailable.");
  });

  it("passes a portal href when the user also has portal access", async () => {
    mockHasPortalAccessForUserId.mockResolvedValue(true);
    mockGetAuthentication.mockResolvedValue(
      authorizedWith(Permission.LeadsRead),
    );

    render(
      await WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(mockHasPortalAccessForUserId).toHaveBeenCalledWith("user-id");
    expect(screen.getByRole("main")).toHaveAttribute(
      "data-portal-href",
      "/de/portal",
    );
  });

  it("omits the portal href when the user has no portal membership", async () => {
    mockHasPortalAccessForUserId.mockResolvedValue(false);
    mockGetAuthentication.mockResolvedValue(
      authorizedWith(Permission.LeadsRead),
    );

    render(
      await WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByRole("main")).not.toHaveAttribute("data-portal-href");
  });

  it("rejects unsupported locales before authentication", async () => {
    await expect(
      WorkspaceLayout({
        children: <p>Protected content</p>,
        params: Promise.resolve({ locale: "fr" }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(mockGetAuthentication).not.toHaveBeenCalled();
  });
});
