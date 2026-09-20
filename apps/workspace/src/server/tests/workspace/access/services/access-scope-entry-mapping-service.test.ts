import { describe, expect, it, vi } from "vitest";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { AccessScopeEntryRow } from "@invessiv/common/contracts/auth/rows/access-scope-entry-row";
import { accessScopeEntryMappingService } from "@/server/workspace/access/services/access-scope-entry-mapping-service";

vi.mock("server-only", () => ({}));

const ASSIGNED_AT = new Date("2026-09-14T08:30:00.000Z");

function row(
  overrides: Partial<AccessScopeEntryRow> = {},
): AccessScopeEntryRow {
  return {
    id: "scope-1",
    workspace_member_id: "member-1",
    member_display_name: "Anna Beispiel",
    role_id: "role-1",
    role_name: "Customer lead",
    role_system_key: null,
    role_active: true,
    customer_id: "customer-1",
    customer_number: 12,
    customer_display_name: "Nordlicht Coaching",
    project_id: null,
    project_title: null,
    assigned_by_user_id: "user-1",
    assigned_at: ASSIGNED_AT,
    ...overrides,
  };
}

describe("accessScopeEntryMappingService.mapRow", () => {
  it("maps a customer-level grant with all display fields and no project title", () => {
    expect(accessScopeEntryMappingService.mapRow(row())).toEqual({
      id: "scope-1",
      workspaceMemberId: "member-1",
      memberDisplayName: "Anna Beispiel",
      roleId: "role-1",
      roleName: "Customer lead",
      roleSystemKey: null,
      roleActive: true,
      scope: { type: AccessScopeType.Customer, customerId: "customer-1" },
      customerNumber: 12,
      customerDisplayName: "Nordlicht Coaching",
      projectTitle: null,
      assignedByUserId: "user-1",
      assignedAt: "2026-09-14T08:30:00.000Z",
    });
  });

  it("maps a project-level grant and carries the project title next to the customer", () => {
    const entry = accessScopeEntryMappingService.mapRow(
      row({ project_id: "project-1", project_title: "Website relaunch" }),
    );

    expect(entry.scope).toEqual({
      type: AccessScopeType.Project,
      customerId: "customer-1",
      projectId: "project-1",
    });
    expect(entry.projectTitle).toBe("Website relaunch");
    expect(entry.customerDisplayName).toBe("Nordlicht Coaching");
  });

  it("reports an inactive role instead of hiding the grant", () => {
    const entry = accessScopeEntryMappingService.mapRow(
      row({ role_active: false }),
    );

    expect(entry.roleActive).toBe(false);
  });

  it("passes the system key through so the view can resolve the label", () => {
    const entry = accessScopeEntryMappingService.mapRow(
      row({ role_system_key: SystemRoleKey.WorkspaceMember }),
    );

    expect(entry.roleSystemKey).toBe(SystemRoleKey.WorkspaceMember);
  });
});
