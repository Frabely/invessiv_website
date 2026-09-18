import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActorRow } from "@invessiv/common/contracts/auth/rows/workspace-actor-row";
import { WorkspaceActorResolutionError } from "@/common/constants/auth/workspace-actor-resolution-errors";
import { workspaceActorMappingService } from "@/server/workspace/auth/services/workspace-actor/workspace-actor-mapping-service";

function row(overrides: Partial<WorkspaceActorRow> = {}): WorkspaceActorRow {
  return {
    user_id: "user-uuid-1",
    user_active: true,
    workspace_member_id: "member-uuid-1",
    member_active: true,
    permission_key: Permission.LeadsRead,
    ...overrides,
  };
}

describe("workspaceActorMappingService.mapRowsToResolution", () => {
  it("reports a missing user when no row exists", () => {
    expect(workspaceActorMappingService.mapRowsToResolution([])).toEqual({
      ok: false,
      code: WorkspaceActorResolutionError.UserMissing,
    });
  });

  it("rejects an inactive user even with an active membership and permissions", () => {
    expect(
      workspaceActorMappingService.mapRowsToResolution([
        row({ user_active: false }),
      ]),
    ).toEqual({ ok: false, code: WorkspaceActorResolutionError.UserInactive });
  });

  it("rejects a user without membership", () => {
    expect(
      workspaceActorMappingService.mapRowsToResolution([
        row({
          workspace_member_id: null,
          member_active: null,
          permission_key: null,
        }),
      ]),
    ).toEqual({
      ok: false,
      code: WorkspaceActorResolutionError.MembershipMissing,
    });
  });

  it("rejects an inactive membership", () => {
    expect(
      workspaceActorMappingService.mapRowsToResolution([
        row({ member_active: false }),
      ]),
    ).toEqual({
      ok: false,
      code: WorkspaceActorResolutionError.MembershipInactive,
    });
  });

  it("builds the actor from the union of all granted permissions", () => {
    const result = workspaceActorMappingService.mapRowsToResolution([
      row({ permission_key: Permission.LeadsRead }),
      row({ permission_key: Permission.LeadsWrite }),
      row({ permission_key: Permission.LeadsRead }),
    ]);

    expect(result).toEqual({
      ok: true,
      actor: {
        userId: "user-uuid-1",
        workspaceMemberId: "member-uuid-1",
        permissions: new Set([Permission.LeadsRead, Permission.LeadsWrite]),
        customerPermissions: new Map(),
        projectPermissions: new Map(),
      },
    });
  });

  it("resolves an active member without roles to an empty permission set", () => {
    const result = workspaceActorMappingService.mapRowsToResolution([
      row({ permission_key: null }),
    ]);

    expect(result).toEqual({
      ok: true,
      actor: expect.objectContaining({ permissions: new Set() }),
    });
  });

  it("drops unknown permission keys instead of trusting them", () => {
    const result = workspaceActorMappingService.mapRowsToResolution([
      row({ permission_key: "leads.everything" }),
      row({ permission_key: "workspace_owner" }),
      row({ permission_key: Permission.DashboardRead }),
    ]);

    expect(result.ok && [...result.actor.permissions]).toEqual([
      Permission.DashboardRead,
    ]);
  });
});
