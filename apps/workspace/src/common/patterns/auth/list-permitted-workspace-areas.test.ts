import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { listPermittedWorkspaceAreas } from "@/common/patterns/auth/list-permitted-workspace-areas";

describe("listPermittedWorkspaceAreas", () => {
  it("returns every area in landing order when all permissions are held", () => {
    const holder = {
      permissions: new Set([Permission.LeadsRead, Permission.DashboardRead]),
    };

    expect(listPermittedWorkspaceAreas(holder)).toEqual([
      WorkspaceArea.Dashboard,
      WorkspaceArea.Leads,
    ]);
  });

  it("returns only areas whose permission is held", () => {
    const holder = { permissions: new Set([Permission.LeadsRead]) };

    expect(listPermittedWorkspaceAreas(holder)).toEqual([WorkspaceArea.Leads]);
  });

  it("returns nothing for write-only permissions", () => {
    const holder = {
      permissions: new Set([Permission.LeadsWrite, Permission.LeadsDelete]),
    };

    expect(listPermittedWorkspaceAreas(holder)).toEqual([]);
  });
});
