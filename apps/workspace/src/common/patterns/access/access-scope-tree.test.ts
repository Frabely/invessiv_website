import { describe, expect, it } from "vitest";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import {
  findDirectScopeAssignment,
  haveSameAccessScopeAssignments,
  isRoleInheritedFromCustomer,
  mergeAccessCustomers,
} from "./access-scope-tree";

const CUSTOMER_SCOPE: AccessScopeEntryDto = {
  id: "scope-customer",
  workspaceMemberId: "member-1",
  roleId: "role-editor",
  scope: { type: AccessScopeType.Customer, customerId: "customer-1" },
  assignedByUserId: "user-owner",
  assignedAt: "2026-09-19T10:00:00.000Z",
  memberDisplayName: "Mara Muster",
  roleName: "Editor",
  roleSystemKey: null,
  roleActive: true,
  customerNumber: 7,
  customerDisplayName: "Nordlicht GmbH",
  projectTitle: null,
};

describe("access scope tree patterns", () => {
  it("marks a customer role as inherited for every project of that customer", () => {
    expect(
      isRoleInheritedFromCustomer(
        [CUSTOMER_SCOPE],
        "customer-1",
        "role-editor",
      ),
    ).toBe(true);
    expect(
      isRoleInheritedFromCustomer(
        [CUSTOMER_SCOPE],
        "customer-2",
        "role-editor",
      ),
    ).toBe(false);
  });

  it("distinguishes a direct project grant from an inherited customer grant", () => {
    expect(
      findDirectScopeAssignment([CUSTOMER_SCOPE], "role-editor", {
        type: AccessScopeType.Project,
        customerId: "customer-1",
        projectId: "project-1",
      }),
    ).toBeUndefined();
  });

  it("keeps assigned customers before new search results and removes duplicates", () => {
    expect(
      mergeAccessCustomers(
        [CUSTOMER_SCOPE],
        [
          { id: "customer-1", customerNumber: 7, displayName: "Nordlicht" },
          { id: "customer-2", customerNumber: 8, displayName: "Südwind" },
        ],
      ).map((customer) => customer.id),
    ).toEqual(["customer-1", "customer-2"]);
  });

  it("compares assignment sets independently of their order", () => {
    const projectScope = {
      roleId: "role-project",
      scope: {
        type: AccessScopeType.Project,
        customerId: "customer-1",
        projectId: "project-1",
      } as const,
    };
    const customerScope = {
      roleId: CUSTOMER_SCOPE.roleId,
      scope: CUSTOMER_SCOPE.scope,
    };

    expect(
      haveSameAccessScopeAssignments(
        [customerScope, projectScope],
        [projectScope, customerScope],
      ),
    ).toBe(true);
    expect(
      haveSameAccessScopeAssignments([customerScope], [projectScope]),
    ).toBe(false);
  });
});
