import { describe, expect, it, vi } from "vitest";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { accessScopeMappingService } from "@/server/workspace/access/services/access-scope-mapping-service";

vi.mock("server-only", () => ({}));

const ASSIGNED_AT = new Date("2026-09-14T08:30:00.000Z");

function row(overrides: { project_id?: string | null } = {}) {
  return {
    id: "scope-1",
    workspace_member_id: "member-1",
    role_id: "role-1",
    customer_id: "customer-1",
    project_id: null,
    assigned_by_user_id: "user-1",
    assigned_at: ASSIGNED_AT,
    ...overrides,
  };
}

describe("accessScopeMappingService.mapRow", () => {
  it("maps a grant without project to a customer scope and names the holder", () => {
    expect(accessScopeMappingService.mapRow(row())).toEqual({
      id: "scope-1",
      workspaceMemberId: "member-1",
      roleId: "role-1",
      scope: { type: AccessScopeType.Customer, customerId: "customer-1" },
      assignedByUserId: "user-1",
      assignedAt: "2026-09-14T08:30:00.000Z",
    });
  });

  it("maps a grant with project to a project scope that keeps its customer", () => {
    const { scope } = accessScopeMappingService.mapRow(
      row({ project_id: "project-1" }),
    );

    expect(scope).toEqual({
      type: AccessScopeType.Project,
      customerId: "customer-1",
      projectId: "project-1",
    });
  });
});
