// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import WorkspacePage, { generateMetadata } from "./page";

const mockAuthenticateWorkspaceRequest = vi.hoisted(() => vi.fn());
const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("notFound called");
  }),
);
const mockRedirect = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
);

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mockAuthenticateWorkspaceRequest,
}));

vi.mock("@/components/workspace/workspace-shell/workspace-shell", () => ({
  WorkspaceShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));

const mockAuth = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

const mockHasPortalAccessForClerkUser = vi.hoisted(() => vi.fn());
vi.mock(
  "@/server/workspace/auth/query-handler/has-portal-access-for-clerk-user.query-handler",
  () => ({
    hasPortalAccessForClerkUser: mockHasPortalAccessForClerkUser,
  }),
);

describe("WorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: null });
    mockHasPortalAccessForClerkUser.mockResolvedValue(false);
  });

  afterEach(cleanup);

  it("redirects unauthenticated visitors to sign in", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.Unauthenticated,
    });

    await expect(
      WorkspacePage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("redirect:/de/sign-in?redirect_url=%2Fde");
  });

  it("shows a pending approval receipt for an authenticated non-member", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.NotMember,
    });

    render(await WorkspacePage({ params: Promise.resolve({ locale: "de" }) }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dein Account ist bereit",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Du musst nichts weiter tun/)).toBeInTheDocument();
  });

  it("redirects a non-member with an active portal membership to the portal", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.NotMember,
    });
    mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
    mockHasPortalAccessForClerkUser.mockResolvedValue(true);

    await expect(
      WorkspacePage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("redirect:/de/portal");

    expect(mockHasPortalAccessForClerkUser).toHaveBeenCalledWith(
      "clerk-user-1",
    );
  });

  it("keeps a non-member with no portal membership on the pending screen", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.NotMember,
    });
    mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
    mockHasPortalAccessForClerkUser.mockResolvedValue(false);

    render(await WorkspacePage({ params: Promise.resolve({ locale: "de" }) }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dein Account ist bereit",
      }),
    ).toBeInTheDocument();
  });

  it("shows no-permission feedback for a member without an accessible area", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.Authorized,
      actor: {
        userId: "user-id",
        workspaceMemberId: "member-id",
        permissions: new Set(),
        customerPermissions: new Map(),
        projectPermissions: new Map(),
      },
    });

    render(await WorkspacePage({ params: Promise.resolve({ locale: "de" }) }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Aktuell ist kein Bereich für dich freigeschaltet",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Keine Berechtigung")).toBeInTheDocument();
  });

  it("shows deactivation feedback for an inactive account", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.Inactive,
    });

    render(await WorkspacePage({ params: Promise.resolve({ locale: "de" }) }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dein Workspace-Zugang ist deaktiviert",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Du musst nichts weiter tun/),
    ).not.toBeInTheDocument();
  });

  it("redirects a permitted member to the first accessible area", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.Authorized,
      actor: {
        userId: "user-id",
        workspaceMemberId: "member-id",
        permissions: new Set([Permission.LeadsRead]),
        customerPermissions: new Map(),
        projectPermissions: new Map(),
      },
    });

    await expect(
      WorkspacePage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/leads");
  });

  it("redirects a member with only customer-scoped access to CRM", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.Authorized,
      actor: {
        userId: "user-id",
        workspaceMemberId: "member-id",
        permissions: new Set(),
        customerPermissions: new Map([
          ["customer-1", new Set([Permission.CustomersRead])],
        ]),
        projectPermissions: new Map(),
      },
    });

    await expect(
      WorkspacePage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("redirect:/de/crm");
  });

  it("fails closed when authorization data is unavailable", async () => {
    mockAuthenticateWorkspaceRequest.mockResolvedValue({
      status: WorkspaceAuthStatus.Unavailable,
    });

    await expect(
      WorkspacePage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("Workspace authorization is unavailable.");
  });

  it("rejects unsupported locales before authentication", async () => {
    await expect(
      WorkspacePage({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("notFound called");

    expect(mockAuthenticateWorkspaceRequest).not.toHaveBeenCalled();
  });

  it("returns localized no-index metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.title).toBe("Workspace");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
