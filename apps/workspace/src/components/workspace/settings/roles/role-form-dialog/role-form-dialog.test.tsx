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

import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
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
    });
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
    expect(
      screen.queryByRole("button", { name: content.dialog.submitEdit }),
    ).toBeNull();
  });
});
