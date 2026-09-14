// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import {
  getSettingsMembersDictionary,
  getSettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { MemberRolesDialog } from "./member-roles-dialog";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replaceMemberRoles: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: { replaceMemberRoles: mocks.replaceMemberRoles },
}));

const content = getSettingsMembersDictionary("de");
const permissionsContent = getSettingsPermissionsDictionary("de");

function role(overrides: Partial<RoleDto>): RoleDto {
  return {
    id: "role",
    name: "Role",
    systemKey: null,
    active: true,
    description: null,
    isSystem: false,
    permissions: [],
    assignedMemberCount: 0,
    version: 1,
    createdAt: "2026-09-13T10:00:00.000Z",
    updatedAt: "2026-09-13T10:00:00.000Z",
    ...overrides,
  };
}

const ROLES = [
  role({
    id: "role-owner",
    systemKey: SystemRoleKey.WorkspaceOwner,
    isSystem: true,
    permissions: [Permission.MembersManage],
  }),
  role({
    id: "role-reader",
    name: "Leser",
    permissions: [Permission.LeadsRead],
  }),
  role({
    id: "role-sales",
    name: "Vertrieb",
    permissions: [Permission.LeadsWrite],
  }),
];

const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  roles: [{ id: "role-reader", name: "Leser", systemKey: null, active: true }],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

function renderDialog(onClose = vi.fn()) {
  render(
    <MemberRolesDialog
      content={content}
      member={MEMBER}
      onCloseAction={onClose}
      permissionsContent={permissionsContent}
      roles={ROLES}
    />,
  );
  return onClose;
}

describe("MemberRolesDialog", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  afterEach(() => {
    cleanup();
  });

  it("never offers the owner role and previews the permissions of the selection", () => {
    renderDialog();

    expect(screen.queryByRole("checkbox", { name: /Owner/ })).toBeNull();
    expect(screen.getByText("Leads ansehen")).toBeInTheDocument();
    expect(screen.queryByText("Leads bearbeiten")).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: /Vertrieb/ }));

    expect(screen.getByText("Leads bearbeiten")).toBeInTheDocument();
  });

  it("keeps the selection on a version conflict and retries with the current version", async () => {
    mocks.replaceMemberRoles
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: {
          ...MEMBER,
          roles: [
            {
              id: "role-sales",
              name: "Vertrieb",
              systemKey: null,
              active: true,
            },
          ],
          version: 5,
        },
      })
      .mockResolvedValueOnce({ ok: true, member: { ...MEMBER, version: 6 } });
    const onClose = renderDialog();

    fireEvent.click(screen.getByRole("checkbox", { name: /Vertrieb/ }));
    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.submit }),
    );

    expect(
      await screen.findByText(content.rolesDialog.conflict),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Vertrieb/ })).toBeChecked();
    const conflict = screen.getByRole("alert");
    expect(
      within(conflict).getByText(content.rolesDialog.conflictCurrentHeading),
    ).toBeInTheDocument();
    expect(within(conflict).getByText("Vertrieb")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.submit }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.replaceMemberRoles).toHaveBeenLastCalledWith("member-1", {
      roleIds: ["role-reader", "role-sales"],
      version: 5,
    });
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
