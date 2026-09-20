import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { listPermittedWorkspaceAreas } from "@/common/patterns/auth/list-permitted-workspace-areas";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

function actorWith(
  permissions: Permission[] = [],
  overrides: Partial<
    Pick<WorkspaceActor, "customerPermissions" | "projectPermissions">
  > = {},
): WorkspaceActor {
  return {
    userId: "user-1",
    workspaceMemberId: "member-1",
    permissions: new Set(permissions),
    customerPermissions: overrides.customerPermissions ?? new Map(),
    projectPermissions: overrides.projectPermissions ?? new Map(),
  };
}

describe("listPermittedWorkspaceAreas", () => {
  it("returns every area in landing order when all permissions are held", () => {
    const holder = actorWith([Permission.LeadsRead, Permission.DashboardRead]);

    expect(listPermittedWorkspaceAreas(holder)).toEqual([
      WorkspaceArea.Dashboard,
      WorkspaceArea.Leads,
    ]);
  });

  it("returns only areas whose permission is held", () => {
    const holder = actorWith([Permission.LeadsRead]);

    expect(listPermittedWorkspaceAreas(holder)).toEqual([WorkspaceArea.Leads]);
  });

  it("returns nothing for write-only permissions", () => {
    const holder = actorWith([Permission.LeadsWrite, Permission.LeadsDelete]);

    expect(listPermittedWorkspaceAreas(holder)).toEqual([]);
  });

  it("opens CRM for a member with only a customer-scoped role", () => {
    const holder = actorWith([], {
      customerPermissions: new Map([
        ["customer-1", new Set([Permission.CustomersRead])],
      ]),
    });

    expect(listPermittedWorkspaceAreas(holder)).toEqual([WorkspaceArea.Crm]);
  });

  it("opens CRM for a member with only a project-scoped role", () => {
    const holder = actorWith([], {
      projectPermissions: new Map([
        [
          "project-1",
          {
            customerId: "customer-1",
            permissions: new Set([Permission.ProjectsRead]),
          },
        ],
      ]),
    });

    expect(listPermittedWorkspaceAreas(holder)).toEqual([WorkspaceArea.Crm]);
  });
});
