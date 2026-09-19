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

import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import {
  getSettingsPermissionsDictionary,
  getSettingsRolesDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { RoleFormDialog } from "./role-form-dialog";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: {
    createRole: mocks.createRole,
    updateRole: mocks.updateRole,
  },
}));

const content = getSettingsRolesDictionary("de");
const permissionsContent = getSettingsPermissionsDictionary("de");

const CUSTOM_ROLE: RoleDto = {
  id: "role-sales",
  name: "Vertrieb",
  systemKey: null,
  active: true,
  description: null,
  isSystem: false,
  permissions: [Permission.LeadsRead],
  assignedMemberCount: 1,
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
  updatedAt: "2026-09-13T10:00:00.000Z",
};

describe("RoleFormDialog", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  afterEach(() => {
    cleanup();
  });

  it("requires a name and locks non-delegable permissions", () => {
    render(
      <RoleFormDialog
        content={content}
        onCloseAction={vi.fn()}
        permissionsContent={permissionsContent}
        role={null}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.dialog.submitCreate }),
    );

    expect(
      screen.getByText(content.dialog.validation.nameRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /^Mitglieder verwalten/ }),
    ).toBeDisabled();
    expect(mocks.createRole).not.toHaveBeenCalled();
  });

  it("creates a custom role with the chosen permissions", async () => {
    mocks.createRole.mockResolvedValue({ ok: true, role: { id: "role-1" } });
    const onClose = vi.fn();
    render(
      <RoleFormDialog
        content={content}
        onCloseAction={onClose}
        permissionsContent={permissionsContent}
        role={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: "Vertrieb" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /^Leads bearbeiten/ }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /^Leads ansehen/ }));
    fireEvent.click(
      screen.getByRole("button", { name: content.dialog.submitCreate }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.createRole).toHaveBeenCalledWith({
      name: "Vertrieb",
      description: null,
      permissions: [Permission.LeadsRead, Permission.LeadsWrite],
      scopeAssignable: false,
    });
  });

  it("locks non-scopable permissions visibly without removing a selection", () => {
    render(
      <RoleFormDialog
        content={content}
        onCloseAction={vi.fn()}
        permissionsContent={permissionsContent}
        role={CUSTOM_ROLE}
      />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: content.dialog.scopeLabel }),
    );

    expect(
      screen.getByRole("checkbox", { name: /^Leads ansehen/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /^Leads ansehen/ }),
    ).toBeDisabled();
    expect(
      screen.getByText(content.dialog.scopeSelectionWarning),
    ).toBeVisible();
    expect(
      screen.getAllByText(permissionsContent.workspaceOnly).length,
    ).toBeGreaterThan(0);
  });

  it("submits the scope-assignable switch", async () => {
    mocks.createRole.mockResolvedValue({ ok: true, role: { id: "role-1" } });
    render(
      <RoleFormDialog
        content={content}
        onCloseAction={vi.fn()}
        permissionsContent={permissionsContent}
        role={null}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: "Kundenbetreuung" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: content.dialog.scopeLabel }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /^Kunden ansehen/ }));
    fireEvent.click(
      screen.getByRole("button", { name: content.dialog.submitCreate }),
    );

    await waitFor(() =>
      expect(mocks.createRole).toHaveBeenCalledWith(
        expect.objectContaining({ scopeAssignable: true }),
      ),
    );
  });

  it("shows a taken name as error and keeps the dialog open", async () => {
    mocks.createRole.mockResolvedValue({
      ok: false,
      code: RoleErrorCode.RoleNameTaken,
    });
    const onClose = vi.fn();
    render(
      <RoleFormDialog
        content={content}
        onCloseAction={onClose}
        permissionsContent={permissionsContent}
        role={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: "Vertrieb" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: content.dialog.submitCreate }),
    );

    expect(
      await screen.findByText(content.errors.ROLE_NAME_TAKEN),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the current server state on conflict while preserving the input", async () => {
    mocks.updateRole.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: {
        ...CUSTOM_ROLE,
        name: "Vertrieb aktuell",
        description: "Aktueller Stand vom Server",
        active: false,
        permissions: [Permission.LeadsWrite],
        version: 3,
      },
    });
    render(
      <RoleFormDialog
        content={content}
        onCloseAction={vi.fn()}
        permissionsContent={permissionsContent}
        role={CUSTOM_ROLE}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: "Mein Entwurf" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: content.dialog.submitEdit }),
    );

    expect(
      await screen.findByText(content.dialog.conflictCurrentHeading),
    ).toBeInTheDocument();
    const conflict = screen.getByRole("alert");
    expect(
      within(conflict).getByText("Vertrieb aktuell · Inaktiv"),
    ).toBeInTheDocument();
    expect(
      within(conflict).getByText("Aktueller Stand vom Server"),
    ).toBeInTheDocument();
    expect(within(conflict).getByText("Leads bearbeiten")).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toHaveValue("Mein Entwurf");
  });

  it("opens system roles read-only", () => {
    const systemRole: RoleDto = {
      id: "role-member",
      name: "Workspace member",
      systemKey: SystemRoleKey.WorkspaceMember,
      active: true,
      description: null,
      isSystem: true,
      permissions: [Permission.LeadsRead],
      assignedMemberCount: 2,
      version: 1,
      createdAt: "2026-09-13T10:00:00.000Z",
      updatedAt: "2026-09-13T10:00:00.000Z",
    };

    render(
      <RoleFormDialog
        content={content}
        onCloseAction={vi.fn()}
        permissionsContent={permissionsContent}
        role={systemRole}
      />,
    );

    const leadsRead = screen.getByRole("checkbox", { name: /^Leads ansehen/ });
    expect(leadsRead).toBeChecked();
    expect(leadsRead).toBeDisabled();
    expect(screen.getByText(content.dialog.readOnlyLabel)).toBeInTheDocument();
    expect(screen.getByText("Leads ansehen")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: content.dialog.submitEdit }),
    ).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: content.dialog.scopeLabel }),
    ).toBeNull();
  });

  it("explains why scope assignment cannot be disabled while assignments exist", async () => {
    mocks.updateRole.mockResolvedValue({
      ok: false,
      code: RoleErrorCode.ScopeAssignmentsExist,
    });
    render(
      <RoleFormDialog
        content={content}
        onCloseAction={vi.fn()}
        permissionsContent={permissionsContent}
        role={{ ...CUSTOM_ROLE, scopeAssignable: true }}
      />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: content.dialog.scopeLabel }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.dialog.submitEdit }),
    );

    expect(
      await screen.findByText(content.errors.ROLE_SCOPE_ASSIGNMENTS_EXIST),
    ).toBeVisible();
  });
});
