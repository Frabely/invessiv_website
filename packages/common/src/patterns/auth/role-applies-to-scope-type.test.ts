import { describe, expect, it } from "vitest";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { roleAppliesToScopeType } from "@invessiv/common/patterns/auth/role-applies-to-scope-type";

describe("roleAppliesToScopeType", () => {
  it("offers a customer-only role at customer scope but not at project scope", () => {
    const permissions = [Permission.CustomersRead, Permission.CustomersWrite];

    expect(roleAppliesToScopeType(permissions, AccessScopeType.Customer)).toBe(
      true,
    );
    expect(roleAppliesToScopeType(permissions, AccessScopeType.Project)).toBe(
      false,
    );
  });

  it("offers a role with at least one project-relevant permission at both scope types", () => {
    const permissions = [Permission.CustomersRead, Permission.ProjectsWrite];

    expect(roleAppliesToScopeType(permissions, AccessScopeType.Customer)).toBe(
      true,
    );
    expect(roleAppliesToScopeType(permissions, AccessScopeType.Project)).toBe(
      true,
    );
  });

  it("offers a non-scope-assignable role at neither scope type", () => {
    const permissions = [Permission.MembersManage];

    expect(roleAppliesToScopeType(permissions, AccessScopeType.Customer)).toBe(
      false,
    );
    expect(roleAppliesToScopeType(permissions, AccessScopeType.Project)).toBe(
      false,
    );
  });

  it("treats an empty permission set as applying to nothing", () => {
    expect(roleAppliesToScopeType([], AccessScopeType.Customer)).toBe(false);
  });
});
