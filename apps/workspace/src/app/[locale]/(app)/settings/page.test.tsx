// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import SettingsPage from "./page";

const mocks = vi.hoisted(() => ({
  requireWorkspaceArea: vi.fn(),
  syncProfiles: vi.fn(),
  listMembers: vi.fn(),
  listRoles: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));
vi.mock("@/lib/auth/permissions", () => ({
  requireWorkspaceArea: mocks.requireWorkspaceArea,
}));
vi.mock(
  "@/server/workspace/access/command-handler/sync-workspace-member-profiles.command-handler",
  () => ({ syncWorkspaceMemberProfiles: mocks.syncProfiles }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-workspace-members.query-handler",
  () => ({ listWorkspaceMembers: mocks.listMembers }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-roles.query-handler",
  () => ({ listRoles: mocks.listRoles }),
);
vi.mock(
  "@/components/workspace/settings/members/members-list/members-list",
  () => ({ MembersList: () => <div data-testid="members-list" /> }),
);
vi.mock("@/components/workspace/settings/roles/roles-list/roles-list", () => ({
  RolesList: () => <div data-testid="roles-list" />,
}));

function renderPage(searchParams: Record<string, string> = {}) {
  return SettingsPage({
    params: Promise.resolve({ locale: "de" }),
    searchParams: Promise.resolve(searchParams),
  });
}

describe("SettingsPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.listMembers.mockResolvedValue([]);
    mocks.listRoles.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("gates the page before loading any data", async () => {
    mocks.requireWorkspaceArea.mockRejectedValue(new Error("NOT_FOUND"));

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.requireWorkspaceArea).toHaveBeenCalledWith("de", "settings");
    expect(mocks.listMembers).not.toHaveBeenCalled();
    expect(mocks.syncProfiles).not.toHaveBeenCalled();
  });

  it("syncs profiles and shows the members tab by default", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(workspaceActorWith());

    render(await renderPage());

    expect(mocks.syncProfiles).toHaveBeenCalled();
    expect(screen.getByTestId("members-list")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rollen" })).toBeInTheDocument();
  });

  it("falls back to the members tab and hides the roles tab without roles.manage", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(
      workspaceActorWith([Permission.MembersManage]),
    );

    render(await renderPage({ tab: "roles" }));

    expect(screen.getByTestId("members-list")).toBeInTheDocument();
    expect(screen.queryByTestId("roles-list")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Rollen" }),
    ).not.toBeInTheDocument();
  });

  it("opens the roles tab with roles.manage without syncing member profiles", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(workspaceActorWith());

    render(await renderPage({ tab: "roles" }));

    expect(screen.getByTestId("roles-list")).toBeInTheDocument();
    expect(mocks.syncProfiles).not.toHaveBeenCalled();
    expect(mocks.listMembers).not.toHaveBeenCalled();
  });
});
