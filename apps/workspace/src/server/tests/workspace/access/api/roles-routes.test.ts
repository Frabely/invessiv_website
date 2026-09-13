import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { PATCH } from "@/app/api/workspace/roles/[id]/route";
import { GET, POST } from "@/app/api/workspace/roles/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/access/query-handler/list-roles.query-handler",
  () => ({ listRoles: mocks.listRoles }),
);
vi.mock(
  "@/server/workspace/access/command-handler/create-role.command-handler",
  () => ({ createRole: mocks.createRole }),
);
vi.mock(
  "@/server/workspace/access/command-handler/update-role.command-handler",
  () => ({ updateRole: mocks.updateRole }),
);

const ROLE: RoleDto = {
  id: "role-1",
  name: "Sales",
  systemKey: null,
  active: true,
  description: null,
  isSystem: false,
  permissions: [Permission.LeadsRead],
  assignedMemberCount: 0,
  version: 1,
  createdAt: "2026-09-13T10:00:00.000Z",
  updatedAt: "2026-09-13T10:00:00.000Z",
};

function jsonRequest(url: string, method: string, body: unknown): NextRequest {
  return new Request(url, {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }) as unknown as NextRequest;
}

const context = { params: Promise.resolve({ id: ROLE.id }) };

describe("roles routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
  });

  it("GET answers 401 without session and 403 without roles.manage", async () => {
    mocks.authenticate.mockResolvedValueOnce(unauthenticatedWorkspaceRequest());
    expect(
      (
        await GET(
          new Request(
            "http://localhost/api/workspace/roles",
          ) as unknown as NextRequest,
        )
      ).status,
    ).toBe(401);

    mocks.authenticate.mockResolvedValueOnce(
      authorizedWorkspaceRequest([Permission.MembersManage]),
    );
    expect(
      (
        await GET(
          new Request(
            "http://localhost/api/workspace/roles",
          ) as unknown as NextRequest,
        )
      ).status,
    ).toBe(403);
    expect(mocks.listRoles).not.toHaveBeenCalled();
  });

  it("POST creates a role with 201", async () => {
    mocks.createRole.mockResolvedValue({ ok: true, role: ROLE });

    const response = await POST(
      jsonRequest("http://localhost/api/workspace/roles", "POST", {
        name: "Sales",
        description: null,
        permissions: [Permission.LeadsRead],
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ role: ROLE });
  });

  it.each([
    [RoleErrorCode.PermissionNotDelegable, 422],
    [RoleErrorCode.RoleNameTaken, 409],
  ])("POST maps %s to %i", async (code, status) => {
    mocks.createRole.mockResolvedValue({ ok: false, code });

    const response = await POST(
      jsonRequest("http://localhost/api/workspace/roles", "POST", {}),
    );

    expect(response.status).toBe(status);
  });

  it("POST returns validation issues as details", async () => {
    const errors = [
      { code: "too_small", path: ["name"], message: "Too small" },
    ];
    mocks.createRole.mockResolvedValue({
      ok: false,
      code: RoleErrorCode.ValidationError,
      errors,
    });

    const response = await POST(
      jsonRequest("http://localhost/api/workspace/roles", "POST", {}),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).details).toEqual(errors);
  });

  it.each([
    [RoleErrorCode.SystemRoleImmutable, 422],
    [RoleErrorCode.RoleNotFound, 404],
  ])("PATCH maps %s to %i", async (code, status) => {
    mocks.updateRole.mockResolvedValue({ ok: false, code });

    const response = await PATCH(
      jsonRequest("http://localhost/api/workspace/roles/role-1", "PATCH", {}),
      context,
    );

    expect(response.status).toBe(status);
  });

  it("PATCH returns the version conflict body", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 2,
      current: ROLE,
    };
    mocks.updateRole.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });

    const response = await PATCH(
      jsonRequest("http://localhost/api/workspace/roles/role-1", "PATCH", {}),
      context,
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(conflict);
  });
});
