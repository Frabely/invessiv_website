// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import {
  getSettingsMembersDictionary,
  getSettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { AddMemberDialog } from "./add-member-dialog";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  listClerkCandidates: vi.fn(),
  addMember: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: {
    listClerkCandidates: mocks.listClerkCandidates,
    addMember: mocks.addMember,
  },
}));

const content = getSettingsMembersDictionary("de");
const permissionsContent = getSettingsPermissionsDictionary("de");

const MEMBER_ROLE: RoleDto = {
  id: "role-member",
  name: "Workspace member",
  systemKey: SystemRoleKey.WorkspaceMember,
  active: true,
  description: null,
  isSystem: true,
  permissions: [],
  assignedMemberCount: 1,
  version: 1,
  createdAt: "2026-09-13T10:00:00.000Z",
  updatedAt: "2026-09-13T10:00:00.000Z",
};

function renderDialog(onClose = vi.fn()) {
  render(
    <AddMemberDialog
      content={content}
      onCloseAction={onClose}
      permissionsContent={permissionsContent}
      roles={[MEMBER_ROLE]}
    />,
  );
  return onClose;
}

describe("AddMemberDialog", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  afterEach(() => {
    cleanup();
  });

  it("explains how to invite someone when no free account exists", async () => {
    mocks.listClerkCandidates.mockResolvedValue({ ok: true, candidates: [] });

    renderDialog();

    expect(
      await screen.findByText(content.addDialog.emptyTitle),
    ).toBeInTheDocument();
  });

  it("requires an account before submitting and preselects the member role", async () => {
    mocks.listClerkCandidates.mockResolvedValue({
      ok: true,
      candidates: [
        {
          clerkUserId: "user_anna",
          displayName: "Anna Beispiel",
          primaryEmail: "anna@example.test",
        },
      ],
    });
    renderDialog();
    await screen.findByText("Anna Beispiel");

    fireEvent.click(
      screen.getByRole("button", { name: content.addDialog.submit }),
    );

    expect(
      screen.getByText(content.addDialog.validation.accountRequired),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Mitglied/ })).toBeChecked();
    expect(mocks.addMember).not.toHaveBeenCalled();
  });

  it("adds the chosen account by clerk id and refreshes the page", async () => {
    mocks.listClerkCandidates.mockResolvedValue({
      ok: true,
      candidates: [
        {
          clerkUserId: "user_anna",
          displayName: "Anna Beispiel",
          primaryEmail: "anna@example.test",
        },
      ],
    });
    mocks.addMember.mockResolvedValue({ ok: true, member: { id: "member-1" } });
    const onClose = renderDialog();

    fireEvent.click(
      await screen.findByRole("radio", { name: /Anna Beispiel/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.addDialog.submit }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.addMember).toHaveBeenCalledWith({
      clerkUserId: "user_anna",
      roleIds: ["role-member"],
    });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("shows the server error and keeps the dialog open", async () => {
    mocks.listClerkCandidates.mockResolvedValue({
      ok: true,
      candidates: [
        {
          clerkUserId: "user_anna",
          displayName: "Anna Beispiel",
          primaryEmail: "anna@example.test",
        },
      ],
    });
    mocks.addMember.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked,
    });
    const onClose = renderDialog();

    fireEvent.click(
      await screen.findByRole("radio", { name: /Anna Beispiel/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.addDialog.submit }),
    );

    expect(
      await screen.findByText(content.errors.CLERK_ACCOUNT_ALREADY_LINKED),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
