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
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { MemberRolesTab } from "@/common/constants/access/member-roles-tabs";
import {
  getSettingsAccessDictionary,
  getSettingsMembersDictionary,
  getSettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { MemberRolesDialog } from "./member-roles-dialog";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replaceMemberRoles: vi.fn(),
  replaceAccessScopes: vi.fn(),
  listAccessCustomers: vi.fn(),
  listAccessCustomerOptions: vi.fn(),
  listAccessCustomerProjects: vi.fn(),
  listMemberAccessScopes: vi.fn(),
  grantAccessScope: vi.fn(),
  revokeAccessScope: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: {
    replaceMemberRoles: mocks.replaceMemberRoles,
    replaceMemberRoleAssignments: mocks.replaceMemberRoles,
    replaceAccessScopes: mocks.replaceAccessScopes,
    listAccessCustomers: mocks.listAccessCustomers,
    listAccessCustomerOptions: mocks.listAccessCustomerOptions,
    listAccessCustomerProjects: mocks.listAccessCustomerProjects,
    listMemberAccessScopes: mocks.listMemberAccessScopes,
    grantAccessScope: mocks.grantAccessScope,
    revokeAccessScope: mocks.revokeAccessScope,
  },
}));

const content = getSettingsMembersDictionary("de");
const permissionsContent = getSettingsPermissionsDictionary("de");
const accessContent = getSettingsAccessDictionary("de");

function role(
  overrides: Partial<RoleAssignmentOptionDto>,
): RoleAssignmentOptionDto {
  return {
    id: "role",
    name: "Role",
    systemKey: null,
    active: true,
    description: null,
    scopeAssignable: false,
    permissions: [],
    ...overrides,
  };
}

const ROLES: RoleAssignmentOptionDto[] = [
  role({
    id: "role-owner",
    systemKey: SystemRoleKey.WorkspaceOwner,
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
  role({
    id: "role-archived",
    name: "Archiv",
    active: false,
    permissions: [Permission.LeadsDelete],
  }),
  role({
    id: "role-customer",
    name: "Kundenbetreuung",
    scopeAssignable: true,
    permissions: [Permission.CustomersRead],
  }),
];

const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  roles: [{ id: "role-reader", name: "Leser", systemKey: null, active: true }],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

function renderDialog(
  overrides: Partial<Parameters<typeof MemberRolesDialog>[0]> = {},
) {
  const onClose = vi.fn();
  render(
    <MemberRolesDialog
      accessContent={accessContent}
      canManageAccess
      content={content}
      initialAccessScopes={[]}
      member={MEMBER}
      onCloseAction={onClose}
      permissionsContent={permissionsContent}
      roles={ROLES}
      rolesHref="/de/settings?tab=roles"
      {...overrides}
    />,
  );
  return onClose;
}

describe("MemberRolesDialog", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.listMemberAccessScopes.mockResolvedValue({
      ok: true,
      accessScopes: [],
    });
    mocks.listAccessCustomerOptions.mockResolvedValue({
      ok: true,
      customers: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("never offers the owner role and previews the permissions of the global selection", () => {
    renderDialog();

    expect(screen.queryByRole("checkbox", { name: /Owner/ })).toBeNull();
    expect(screen.getByText("Leads ansehen")).toBeInTheDocument();
    expect(screen.queryByText("Leads bearbeiten")).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: /Vertrieb/ }));

    expect(screen.getByText("Leads bearbeiten")).toBeInTheDocument();
  });

  it("requires an explicit save and marks the global tab unsaved until then", async () => {
    mocks.replaceMemberRoles.mockResolvedValue({
      ok: true,
      member: { ...MEMBER, version: 3 },
    });
    const onClose = renderDialog();
    const submit = screen.getByRole("button", {
      name: content.rolesDialog.submit,
    });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /Vertrieb/ }));

    expect(screen.getByText(content.rolesDialog.unsaved)).toBeVisible();
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.replaceMemberRoles).toHaveBeenCalledWith("member-1", {
      roleIds: ["role-reader", "role-sales"],
      accessScopeAssignments: [],
      version: 2,
    });
  });

  it("offers an inactive role the fresh state holds after a conflict, so it is not removed unseen", async () => {
    mocks.replaceMemberRoles.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: {
        ...MEMBER,
        roles: [
          ...MEMBER.roles,
          {
            id: "role-archived",
            name: "Archiv",
            systemKey: null,
            active: false,
          },
        ],
        version: 5,
      },
    });
    renderDialog();

    expect(screen.queryByRole("checkbox", { name: /Archiv/ })).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: /Vertrieb/ }));
    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.submit }),
    );

    expect(
      await screen.findByRole("checkbox", { name: /Archiv/ }),
    ).not.toBeChecked();
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
      accessScopeAssignments: [],
      version: 5,
    });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("resubmits the freshest legacy customer-scoped assignment after a version conflict, not the stale one from mount", async () => {
    const memberWithLegacyAssignment = {
      ...MEMBER,
      roles: [
        ...MEMBER.roles,
        {
          id: "role-customer",
          name: "Kundenbetreuung",
          systemKey: null,
          active: true,
        },
      ],
    };
    mocks.replaceMemberRoles
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: {
          ...memberWithLegacyAssignment,
          // Someone else removed the legacy assignment before this retry.
          roles: [
            { id: "role-reader", name: "Leser", systemKey: null, active: true },
          ],
          version: 5,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        member: { ...memberWithLegacyAssignment, version: 6 },
      });

    renderDialog({ member: memberWithLegacyAssignment });

    fireEvent.click(screen.getByRole("checkbox", { name: /Vertrieb/ }));
    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.submit }),
    );

    await screen.findByText(content.rolesDialog.conflict);

    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.submit }),
    );

    await waitFor(() =>
      expect(mocks.replaceMemberRoles).toHaveBeenLastCalledWith("member-1", {
        roleIds: ["role-reader", "role-sales"],
        accessScopeAssignments: [],
        version: 5,
      }),
    );
  });

  it("switches tabs with the arrow keys and moves focus along", () => {
    renderDialog();
    const globalTab = screen.getByRole("tab", {
      name: new RegExp(content.rolesDialog.globalTab),
    });
    const customerTab = screen.getByRole("tab", {
      name: content.rolesDialog.customerTab,
    });
    globalTab.focus();

    fireEvent.keyDown(globalTab, { key: "ArrowRight" });

    expect(customerTab).toHaveFocus();
    expect(customerTab).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("button", { name: content.rolesDialog.submit }),
    ).toBeDisabled();

    fireEvent.keyDown(customerTab, { key: "Home" });

    expect(globalTab).toHaveFocus();
    expect(globalTab).toHaveAttribute("aria-selected", "true");
  });

  it("hides the customer tab entirely when access cannot be managed", () => {
    renderDialog({
      canManageAccess: false,
      initialTab: MemberRolesTab.Customer,
    });

    expect(
      screen.queryByRole("tab", { name: content.rolesDialog.customerTab }),
    ).toBeNull();
    expect(
      screen.getByRole("tab", {
        name: new RegExp(content.rolesDialog.globalTab),
      }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("keeps both drafts while switching tabs", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("checkbox", { name: /Vertrieb/ }));

    fireEvent.click(
      screen.getByRole("tab", { name: content.rolesDialog.customerTab }),
    );

    expect(
      screen.getByRole("tab", { name: content.rolesDialog.customerTab }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("opens directly on the customer tab with a disabled Save action", () => {
    renderDialog({ initialTab: MemberRolesTab.Customer });

    expect(
      screen.getByRole("tab", { name: content.rolesDialog.customerTab }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("button", { name: content.rolesDialog.submit }),
    ).toBeDisabled();
  });

  it("asks for confirmation before discarding an unsaved global draft on close", () => {
    const onClose = renderDialog();
    fireEvent.click(screen.getByRole("checkbox", { name: /Vertrieb/ }));

    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.cancel }),
    );

    expect(screen.getByText(content.rolesDialog.discardTitle)).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();

    const keepEditingButtons = screen.getAllByRole("button", {
      name: content.rolesDialog.keepEditing,
    });
    fireEvent.click(keepEditingButtons[keepEditingButtons.length - 1]!);
    expect(screen.queryByText(content.rolesDialog.discardTitle)).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.cancel }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.discard }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without confirmation when the global draft is unchanged", () => {
    const onClose = renderDialog();

    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.cancel }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(content.rolesDialog.discardTitle)).toBeNull();
  });
});
