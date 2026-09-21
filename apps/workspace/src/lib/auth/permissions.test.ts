import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import {
  requireWorkspaceActor,
  requireWorkspaceArea,
  requireWorkspacePermission,
} from "./permissions";
import { WorkspaceAuthorizationUnavailableError } from "./workspace-authorization-unavailable-error.class";

vi.mock("server-only", () => ({}));

const { mockAuthenticate, mockRedirect, mockNotFound } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  mockNotFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("./workspace-authentication", () => ({
  authenticateWorkspaceRequest: mockAuthenticate,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

function authorizedWith(...permissions: Permission[]) {
  return {
    status: WorkspaceAuthStatus.Authorized,
    actor: {
      userId: "user-uuid-1",
      workspaceMemberId: "member-uuid-1",
      permissions: new Set(permissions),
      customerPermissions: new Map(),
      projectPermissions: new Map(),
    },
  };
}

describe("requireWorkspaceActor", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it("redirects unauthenticated visitors to the locale-aware sign-in page", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Unauthenticated,
    });

    await expect(requireWorkspaceActor("de")).rejects.toThrow(
      "REDIRECT:/de/sign-in?redirect_url=%2Fde",
    );
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("uses the requested locale for the redirect target", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Unauthenticated,
    });

    await expect(requireWorkspaceActor("en")).rejects.toThrow(
      "REDIRECT:/en/sign-in?redirect_url=%2Fen",
    );
  });

  it("answers 404 for a signed-in account without membership", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.NotMember,
    });

    await expect(requireWorkspaceActor("de")).rejects.toThrow("NOT_FOUND");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects an inactive account to its explanatory access status", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Inactive,
    });

    await expect(requireWorkspaceActor("de")).rejects.toThrow("REDIRECT:/de");
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("throws instead of rendering when authorization data is unavailable", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Unavailable,
    });

    await expect(requireWorkspaceActor("de")).rejects.toBeInstanceOf(
      WorkspaceAuthorizationUnavailableError,
    );
  });

  it("returns the resolved actor", async () => {
    const authentication = authorizedWith(Permission.LeadsRead);
    mockAuthenticate.mockResolvedValue(authentication);

    await expect(requireWorkspaceActor("de")).resolves.toBe(
      authentication.actor,
    );
  });
});

describe("requireWorkspacePermission", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockNotFound.mockClear();
  });

  it("returns the actor when the permission is held", async () => {
    mockAuthenticate.mockResolvedValue(authorizedWith(Permission.LeadsRead));

    await expect(
      requireWorkspacePermission("de", Permission.LeadsRead),
    ).resolves.toMatchObject({ userId: "user-uuid-1" });
  });

  it("answers 404 when the permission is missing", async () => {
    mockAuthenticate.mockResolvedValue(authorizedWith(Permission.LeadsRead));

    await expect(
      requireWorkspacePermission("de", Permission.LeadsDelete),
    ).rejects.toThrow("NOT_FOUND");
  });
});

describe("requireWorkspaceArea", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockNotFound.mockClear();
  });

  it("opens an area through its registered permission", async () => {
    mockAuthenticate.mockResolvedValue(
      authorizedWith(Permission.DashboardRead),
    );

    await expect(
      requireWorkspaceArea("de", WorkspaceArea.Dashboard),
    ).resolves.toMatchObject({ workspaceMemberId: "member-uuid-1" });
  });

  it("hides an area whose permission is missing", async () => {
    mockAuthenticate.mockResolvedValue(
      authorizedWith(Permission.DashboardRead),
    );

    await expect(
      requireWorkspaceArea("de", WorkspaceArea.Leads),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("opens CRM through project-line-items.read", async () => {
    mockAuthenticate.mockResolvedValue(
      authorizedWith(Permission.ProjectLineItemsRead),
    );

    await expect(
      requireWorkspaceArea("de", WorkspaceArea.Crm),
    ).resolves.toMatchObject({ workspaceMemberId: "member-uuid-1" });
  });
});
