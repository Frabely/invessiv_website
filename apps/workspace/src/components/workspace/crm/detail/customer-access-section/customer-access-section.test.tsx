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

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { getCrmAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { CustomerAccessSection } from "./customer-access-section";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  revoke: vi.fn(),
  listProjects: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: {
    grantAccessScope: vi.fn(),
    listAccessCustomers: vi.fn(),
    listAccessCustomerProjects: mocks.listProjects,
    replaceAccessScopes: mocks.replace,
    revokeAccessScope: mocks.revoke,
  },
}));

const content = getCrmAccessDictionary("de");
const member: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Mara Muster",
  primaryEmail: "mara@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 1,
  roles: [],
  version: 2,
  createdAt: "2026-09-19T08:00:00.000Z",
};
const customer = {
  id: "customer-1",
  customerNumber: 7,
  displayName: "Nordlicht GmbH",
};
const assignment: AccessScopeEntryDto = {
  id: "scope-1",
  workspaceMemberId: member.id,
  roleId: "role-1",
  scope: { type: AccessScopeType.Customer, customerId: customer.id },
  assignedByUserId: "owner-1",
  assignedAt: "2026-09-19T09:00:00.000Z",
  memberDisplayName: member.displayName,
  roleName: "Kundenbetreuung",
  roleSystemKey: null,
  roleActive: true,
  customerNumber: customer.customerNumber,
  customerDisplayName: customer.displayName,
  projectTitle: null,
};
const projects = [
  { id: "project-1", customerId: customer.id, title: "Website-Relaunch" },
  { id: "project-2", customerId: customer.id, title: "Onlineshop" },
];
const roles = [
  {
    id: "role-1",
    name: "Kundenbetreuung",
    systemKey: null,
    active: true,
    description: null,
    scopeAssignable: true,
    permissions: [Permission.CustomersRead],
  },
];

function renderSection() {
  return render(
    <CustomerAccessSection
      accessScopes={[assignment]}
      content={content}
      customer={customer}
      members={[member]}
      permissionsContent={getSettingsPermissionsDictionary("de")}
      projects={projects}
      roles={roles}
      rolesHref="/de/settings?tab=roles"
    />,
  );
}

describe("CustomerAccessSection", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.listProjects.mockResolvedValue({ ok: true, projects });
  });

  afterEach(cleanup);

  it("groups customer access and keeps projects without direct assignments visible", () => {
    renderSection();

    expect(
      screen.getByRole("heading", { name: content.section.wholeCustomer }),
    ).toBeVisible();
    expect(screen.getByText(member.displayName)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Projekt Website-Relaunch" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Projekt Onlineshop" }),
    ).toBeVisible();
    expect(screen.getAllByText(content.section.emptyGroup)).toHaveLength(2);
    expect(screen.getAllByText(content.section.inheritedHint)).toHaveLength(2);
  });

  it("preselects the customer and hides customer search when granting access", () => {
    renderSection();
    fireEvent.click(
      screen.getByRole("button", { name: content.section.giveAccess }),
    );

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.queryByLabelText(content.tree.searchLabel)).toBeNull();
    expect(screen.getAllByText("K0007 · Nordlicht GmbH")).toHaveLength(2);
  });

  it("stages changes in the give-access dialog until Save is pressed", async () => {
    mocks.replace.mockResolvedValue({
      ok: true,
      current: { ...member, accessScopeCount: 0, version: 3 },
    });
    renderSection();
    fireEvent.click(
      screen.getByRole("button", { name: content.section.giveAccess }),
    );

    const save = screen.getByRole("button", { name: content.dialog.submit });
    expect(save).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /Kundenbetreuung/ }));

    expect(mocks.replace).not.toHaveBeenCalled();
    expect(save).not.toBeDisabled();
    fireEvent.click(save);

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(member.id, {
        assignments: [],
        version: member.version,
      }),
    );
  });

  it("removes an assignment and refreshes the customer section", async () => {
    mocks.revoke.mockResolvedValue({
      ok: true,
      member: { ...member, accessScopeCount: 0, version: 3 },
    });
    renderSection();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Zugriff Kundenbetreuung von Mara Muster/,
      }),
    );

    await waitFor(() =>
      expect(mocks.revoke).toHaveBeenCalledWith(member.id, assignment.id, {
        version: member.version,
      }),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
