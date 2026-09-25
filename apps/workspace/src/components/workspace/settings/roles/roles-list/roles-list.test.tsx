// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import {
  getSettingsPermissionsDictionary,
  getSettingsRolesDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { RolesList } from "./roles-list";

vi.mock("../role-row/role-row", () => ({
  RoleRow: ({ role }: { role: RoleDto }) => <li>{role.name}</li>,
}));
vi.mock("../role-form-dialog/role-form-dialog", () => ({
  RoleFormDialog: ({ realm }: { realm: string }) => (
    <div data-testid="role-dialog">{realm}</div>
  ),
}));

afterEach(cleanup);
const role = (name: string, realm: AuthRealm): RoleDto => ({
  id: name,
  name,
  realm,
  systemKey: null,
  active: true,
  scopeAssignable: false,
  description: null,
  isSystem: false,
  permissions: [],
  assignedMemberCount: 0,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("RolesList", () => {
  it("switches between staff and portal roles without mixing realms", () => {
    const content = getSettingsRolesDictionary("de");
    render(
      <RolesList
        content={content}
        permissionsContent={getSettingsPermissionsDictionary("de")}
        roles={[
          role("Staff role", AuthRealm.Workspace),
          role("Portal role", AuthRealm.Portal),
        ]}
      />,
    );
    expect(screen.getByText("Staff role")).toBeInTheDocument();
    expect(screen.queryByText("Portal role")).not.toBeInTheDocument();
    expect(
      screen.queryByText(content.list.portalIntro),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Portal" }));
    expect(screen.getByText("Portal role")).toBeInTheDocument();
    expect(screen.queryByText("Staff role")).not.toBeInTheDocument();
    expect(screen.getByText(content.list.portalIntro)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rolle anlegen" }));
    expect(screen.getByTestId("role-dialog")).toHaveTextContent(
      AuthRealm.Portal,
    );
  });
});
