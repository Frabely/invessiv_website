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
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import {
  getSettingsAccessDictionary,
  getSettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { AccessScopeTree } from "./access-scope-tree";

const mocks = vi.hoisted(() => ({
  listCustomers: vi.fn(),
  listMemberAccessScopes: vi.fn(),
  listProjects: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: {
    listAccessCustomers: mocks.listCustomers,
    listMemberAccessScopes: mocks.listMemberAccessScopes,
    listAccessCustomerProjects: mocks.listProjects,
    replaceAccessScopes: mocks.replace,
  },
}));

const accessContent = getSettingsAccessDictionary("de");
const permissionsContent = getSettingsPermissionsDictionary("de");
const CUSTOMER = {
  id: "customer-1",
  customerNumber: 7,
  displayName: "Nordlicht GmbH",
};
const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Mara Muster",
  primaryEmail: "mara@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 2,
  roles: [],
  version: 3,
  createdAt: "2026-09-19T08:00:00.000Z",
};
const ROLES: RoleAssignmentOptionDto[] = [
  {
    id: "role-customer",
    name: "Kundenbetreuung",
    systemKey: null,
    active: true,
    description: null,
    scopeAssignable: true,
    permissions: [Permission.CustomersRead, Permission.ProjectsRead],
  },
  {
    id: "role-project",
    name: "Projektarbeit",
    systemKey: null,
    active: true,
    description: null,
    scopeAssignable: true,
    permissions: [Permission.ProjectsRead],
  },
  {
    id: "role-workspace",
    name: "Vertrieb",
    systemKey: null,
    active: true,
    description: null,
    scopeAssignable: false,
    permissions: [Permission.LeadsRead],
  },
  {
    id: "role-customer-only",
    name: "Kundenverwaltung",
    systemKey: null,
    active: true,
    description: null,
    scopeAssignable: true,
    permissions: [Permission.CustomersRead, Permission.CustomersWrite],
  },
];

function scope(
  id: string,
  roleId: string,
  value: AccessScopeEntryDto["scope"],
): AccessScopeEntryDto {
  return {
    id,
    workspaceMemberId: MEMBER.id,
    roleId,
    scope: value,
    assignedByUserId: "owner-1",
    assignedAt: "2026-09-19T09:00:00.000Z",
    memberDisplayName: MEMBER.displayName,
    roleName: ROLES.find((role) => role.id === roleId)?.name ?? roleId,
    roleSystemKey: null,
    roleActive: true,
    customerNumber: CUSTOMER.customerNumber,
    customerDisplayName: CUSTOMER.displayName,
    projectTitle:
      value.type === AccessScopeType.Project ? "Website-Relaunch" : null,
  };
}

const CUSTOMER_SCOPE = scope("scope-customer", "role-customer", {
  type: AccessScopeType.Customer,
  customerId: CUSTOMER.id,
});
const PROJECT_SCOPE = scope("scope-project", "role-project", {
  type: AccessScopeType.Project,
  customerId: CUSTOMER.id,
  projectId: "project-1",
});
const DIRECT_AND_INHERITED_SCOPE = scope(
  "scope-project-customer-role",
  "role-customer",
  {
    type: AccessScopeType.Project,
    customerId: CUSTOMER.id,
    projectId: "project-1",
  },
);

function renderTree(
  accessScopes: readonly AccessScopeEntryDto[] = [
    CUSTOMER_SCOPE,
    PROJECT_SCOPE,
  ],
  fixedCustomer = CUSTOMER,
) {
  return render(
    <AccessScopeTree
      accessContent={accessContent}
      canManageAccess
      fixedCustomer={fixedCustomer}
      initialAccessScopes={accessScopes}
      member={MEMBER}
      permissionsContent={permissionsContent}
      roles={ROLES}
      rolesHref="/de/settings?tab=roles"
      formId="access-form"
    />,
  );
}

describe("AccessScopeTree", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.listProjects.mockResolvedValue({
      ok: true,
      projects: [
        { id: "project-1", customerId: CUSTOMER.id, title: "Website-Relaunch" },
      ],
    });
    mocks.listMemberAccessScopes.mockResolvedValue({
      ok: true,
      accessScopes: [],
    });
  });

  afterEach(() => cleanup());

  it("shows an inherited role checked and disabled on the project row", async () => {
    renderTree();
    fireEvent.click(
      screen.getByRole("button", { name: /Nordlicht GmbH aufklappen/ }),
    );

    const inherited = await screen.findAllByRole("checkbox", {
      name: /Kundenbetreuung/,
    });
    expect(inherited).toHaveLength(2);
    expect(inherited[1]).toBeChecked();
    expect(inherited[1]).toBeDisabled();
    expect(screen.getByText(accessContent.inherited)).toBeVisible();
  });

  it("offers only scope-assignable roles, not workspace-only ones", () => {
    renderTree();
    expect(screen.queryByRole("checkbox", { name: /Vertrieb/ })).toBeNull();
  });

  it("offers a customer-only role at the customer row but not at the project row", async () => {
    renderTree();

    expect(
      screen.getByRole("checkbox", { name: /Kundenverwaltung/ }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Nordlicht GmbH aufklappen/ }),
    );
    await screen.findAllByRole("checkbox", { name: /Projektarbeit/ });

    expect(
      screen.getAllByRole("checkbox", { name: /Kundenverwaltung/ }),
    ).toHaveLength(1);
  });

  it("limits fixed-customer mode to the selected customer", () => {
    const otherScope: AccessScopeEntryDto = {
      ...CUSTOMER_SCOPE,
      id: "scope-other",
      scope: {
        type: AccessScopeType.Customer,
        customerId: "customer-2",
      },
      customerNumber: 8,
      customerDisplayName: "Südwind GmbH",
    };
    renderTree([CUSTOMER_SCOPE, otherScope]);

    expect(screen.getByText("K0007 · Nordlicht GmbH")).toBeVisible();
    expect(screen.queryByText("K0008 · Südwind GmbH")).toBeNull();
  });

  it("stages changes and replaces all assignments only when the form is submitted", async () => {
    let resolveReplace: ((value: unknown) => void) | undefined;
    mocks.replace.mockReturnValue(
      new Promise((resolve) => {
        resolveReplace = resolve;
      }),
    );
    renderTree([], CUSTOMER);
    const customerRole = screen.getByRole("checkbox", {
      name: /Kundenbetreuung/,
    });
    const projectRole = screen.getByRole("checkbox", { name: /Projektarbeit/ });
    fireEvent.click(customerRole);

    expect(customerRole).toBeChecked();
    expect(projectRole).not.toBeDisabled();
    expect(mocks.replace).not.toHaveBeenCalled();

    fireEvent.submit(document.getElementById("access-form")!);

    expect(mocks.replace).toHaveBeenCalledWith(MEMBER.id, {
      assignments: [
        {
          roleId: "role-customer",
          scope: { type: AccessScopeType.Customer, customerId: CUSTOMER.id },
        },
      ],
      version: MEMBER.version,
    });
    await waitFor(() => expect(customerRole).toBeDisabled());
    resolveReplace?.({
      ok: true,
      current: { ...MEMBER, version: 4 },
    });
  });

  it("explains the next steps when the last assignment cannot be removed", async () => {
    mocks.replace.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberWithoutRole,
    });
    renderTree([CUSTOMER_SCOPE]);

    fireEvent.click(screen.getByRole("checkbox", { name: /Kundenbetreuung/ }));
    fireEvent.submit(document.getElementById("access-form")!);

    expect(
      await screen.findByText(
        accessContent.errors[WorkspaceMemberErrorCode.MemberWithoutRole],
      ),
    ).toBeVisible();
  });

  it("adopts a version conflict and keeps the remaining rows", async () => {
    mocks.replace.mockResolvedValue({
      ok: false,
      code: "VERSION_CONFLICT",
      current: { ...MEMBER, version: 4 },
    });
    renderTree();
    fireEvent.click(
      screen.getAllByRole("checkbox", { name: /Kundenbetreuung/ })[0]!,
    );
    fireEvent.submit(document.getElementById("access-form")!);

    expect(await screen.findByText(accessContent.conflict)).toBeVisible();
    expect(
      screen.getAllByRole("checkbox", { name: /Kundenbetreuung/ })[0],
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /Projektarbeit/ }),
    ).toBeVisible();
  });

  it("keeps the draft after a conflict and retries with the current version", async () => {
    mocks.replace
      .mockResolvedValueOnce({
        ok: false,
        code: "VERSION_CONFLICT",
        current: { ...MEMBER, version: 4 },
      })
      .mockResolvedValueOnce({ ok: true, current: { ...MEMBER, version: 5 } });
    renderTree();
    fireEvent.click(
      screen.getAllByRole("checkbox", { name: /Kundenbetreuung/ })[0]!,
    );
    fireEvent.submit(document.getElementById("access-form")!);

    expect(await screen.findByText(accessContent.conflict)).toBeVisible();
    fireEvent.submit(document.getElementById("access-form")!);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledTimes(2));
    expect(mocks.replace.mock.calls[0]?.[1]).toMatchObject({ version: 3 });
    expect(mocks.replace.mock.calls[1]?.[1]).toMatchObject({ version: 4 });
  });

  it("keeps only the latest search response", async () => {
    let resolveFirst!: (value: {
      ok: true;
      customers: Array<typeof CUSTOMER>;
    }) => void;
    let resolveSecond!: (value: {
      ok: true;
      customers: Array<typeof CUSTOMER>;
    }) => void;
    mocks.listCustomers
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );
    render(
      <AccessScopeTree
        accessContent={accessContent}
        canManageAccess
        initialAccessScopes={[]}
        member={MEMBER}
        permissionsContent={permissionsContent}
        roles={ROLES}
        rolesHref="/de/settings?tab=roles"
      />,
    );
    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "Nord" } });
    await waitFor(() => expect(mocks.listCustomers).toHaveBeenCalledTimes(1));
    fireEvent.change(search, { target: { value: "Süd" } });
    await waitFor(() => expect(mocks.listCustomers).toHaveBeenCalledTimes(2));

    resolveSecond({
      ok: true,
      customers: [
        { id: "customer-2", customerNumber: 8, displayName: "Südwind GmbH" },
      ],
    });
    expect(await screen.findByText("K0008 · Südwind GmbH")).toBeVisible();
    resolveFirst({ ok: true, customers: [CUSTOMER] });
    await waitFor(() =>
      expect(screen.queryByText("K0007 · Nordlicht GmbH")).toBeNull(),
    );
    expect(screen.getByText("K0008 · Südwind GmbH")).toBeVisible();
  });

  it("shows a search failure instead of an empty-result message", async () => {
    mocks.listCustomers.mockResolvedValue({ ok: false, code: "INTERNAL" });
    render(
      <AccessScopeTree
        accessContent={accessContent}
        canManageAccess
        initialAccessScopes={[]}
        member={MEMBER}
        permissionsContent={permissionsContent}
        roles={ROLES}
        rolesHref="/de/settings?tab=roles"
      />,
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Nord" },
    });

    expect(await screen.findByText(accessContent.searchError)).toBeVisible();
    expect(screen.queryByText(accessContent.noResultsTitle)).toBeNull();
  });

  it("shows a retry action when projects fail to load", async () => {
    mocks.listProjects.mockResolvedValueOnce({
      ok: false,
      code: "INTERNAL",
    });
    renderTree();
    fireEvent.click(
      screen.getByRole("button", { name: /Nordlicht GmbH aufklappen/ }),
    );

    expect(
      await screen.findByRole("button", {
        name: /Projekte für .*Nordlicht GmbH erneut laden/,
      }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Projekte für .*Nordlicht GmbH erneut laden/,
      }),
    );
    expect(await screen.findByText("Website-Relaunch")).toBeVisible();
    expect(mocks.listProjects).toHaveBeenCalledTimes(2);
  });

  it("can remove a direct project grant while the role remains inherited", async () => {
    mocks.replace.mockResolvedValue({
      ok: true,
      current: { ...MEMBER, version: 4 },
    });
    renderTree([CUSTOMER_SCOPE, DIRECT_AND_INHERITED_SCOPE]);
    fireEvent.click(
      screen.getByRole("button", { name: /Nordlicht GmbH aufklappen/ }),
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: /Direkte Zuweisung Kundenbetreuung bei .*Website-Relaunch entfernen/,
      }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("button", {
          name: /Direkte Zuweisung Kundenbetreuung bei .*Website-Relaunch entfernen/,
        }),
      ).toBeNull(),
    );
    expect(
      screen.getAllByRole("checkbox", { name: /Kundenbetreuung/ })[1],
    ).toBeChecked();
    expect(mocks.replace).not.toHaveBeenCalled();

    fireEvent.submit(document.getElementById("access-form")!);

    expect(mocks.replace).toHaveBeenCalledWith(MEMBER.id, {
      assignments: [
        { roleId: CUSTOMER_SCOPE.roleId, scope: CUSTOMER_SCOPE.scope },
      ],
      version: MEMBER.version,
    });
  });

  it("keeps assigned customers visible during a search with no results", async () => {
    render(
      <AccessScopeTree
        accessContent={accessContent}
        canManageAccess
        initialAccessScopes={[CUSTOMER_SCOPE]}
        member={MEMBER}
        permissionsContent={permissionsContent}
        roles={ROLES}
        rolesHref="/de/settings?tab=roles"
      />,
    );
    mocks.listCustomers.mockResolvedValue({ ok: true, customers: [] });
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Unbekannt" },
    });

    expect(await screen.findByText(accessContent.noResultsTitle)).toBeVisible();
    expect(screen.getByText("K0007 · Nordlicht GmbH")).toBeVisible();
  });

  it("distinguishes the initial empty state from no search results", async () => {
    render(
      <AccessScopeTree
        accessContent={accessContent}
        canManageAccess
        initialAccessScopes={[]}
        member={MEMBER}
        permissionsContent={permissionsContent}
        roles={ROLES}
        rolesHref="/de/settings?tab=roles"
      />,
    );
    expect(screen.getByText(accessContent.emptyTitle)).toBeVisible();
    mocks.listCustomers.mockResolvedValue({ ok: true, customers: [] });
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Nichts" },
    });
    expect(await screen.findByText(accessContent.noResultsTitle)).toBeVisible();
    expect(screen.queryByText(accessContent.emptyTitle)).toBeNull();
  });

  it("shows a role-catalog empty state and hides the tree when no customer role exists", () => {
    render(
      <AccessScopeTree
        accessContent={accessContent}
        canManageAccess
        initialAccessScopes={[]}
        member={MEMBER}
        permissionsContent={permissionsContent}
        roles={[]}
        rolesHref="/de/settings?tab=roles"
      />,
    );

    expect(screen.getByText(accessContent.noCustomerRolesTitle)).toBeVisible();
    expect(
      screen.getByRole("link", { name: accessContent.openRoleCatalog }),
    ).toHaveAttribute("href", "/de/settings?tab=roles");
    expect(
      screen.queryByRole("list", { name: accessContent.treeLabel }),
    ).toBeNull();
  });

  it("includes a member's global-role permissions in the effective-permissions preview", async () => {
    const globalRole: RoleAssignmentOptionDto = {
      id: "role-global-sales",
      name: "Vertrieb",
      systemKey: null,
      active: true,
      description: null,
      scopeAssignable: false,
      permissions: [Permission.LeadsWrite],
    };
    render(
      <AccessScopeTree
        accessContent={accessContent}
        canManageAccess
        fixedCustomer={CUSTOMER}
        initialAccessScopes={[]}
        member={{
          ...MEMBER,
          roles: [
            {
              id: globalRole.id,
              name: globalRole.name,
              systemKey: null,
              active: true,
            },
          ],
        }}
        permissionsContent={permissionsContent}
        roles={[...ROLES, globalRole]}
        rolesHref="/de/settings?tab=roles"
      />,
    );

    fireEvent.focus(screen.getByRole("checkbox", { name: /Kundenbetreuung/ }));

    expect(await screen.findByText("Leads bearbeiten")).toBeVisible();
  });

  it("shows the role-catalog empty state when every passed-in role is workspace-only", () => {
    const globalOnlyRole: RoleAssignmentOptionDto = {
      id: "role-global-only",
      name: "Vertrieb",
      systemKey: null,
      active: true,
      description: null,
      scopeAssignable: false,
      permissions: [Permission.LeadsRead],
    };
    render(
      <AccessScopeTree
        accessContent={accessContent}
        canManageAccess
        initialAccessScopes={[]}
        member={MEMBER}
        permissionsContent={permissionsContent}
        roles={[globalOnlyRole]}
        rolesHref="/de/settings?tab=roles"
      />,
    );

    expect(screen.getByText(accessContent.noCustomerRolesTitle)).toBeVisible();
    expect(screen.queryByRole("searchbox")).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: accessContent.treeLabel }),
    ).toBeNull();
  });

  it("places search, expand and role checkboxes in reading order", () => {
    render(
      <AccessScopeTree
        accessContent={accessContent}
        canManageAccess
        initialAccessScopes={[CUSTOMER_SCOPE]}
        member={MEMBER}
        permissionsContent={permissionsContent}
        roles={ROLES}
        rolesHref="/de/settings?tab=roles"
      />,
    );
    const search = screen.getByRole("searchbox");
    const expand = screen.getByRole("button", { name: /aufklappen/ });
    const checkbox = screen.getAllByRole("checkbox")[0]!;
    expect(
      search.compareDocumentPosition(expand) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      expand.compareDocumentPosition(checkbox) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
