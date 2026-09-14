import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { POST as getCandidates } from "@/app/api/workspace/members/clerk-candidates/route";
import {
  DELETE as revokeOwner,
  POST as grantOwner,
} from "@/app/api/workspace/members/[id]/owner/route";
import { PUT as replaceRoles } from "@/app/api/workspace/members/[id]/roles/route";
import { GET, POST } from "@/app/api/workspace/members/route";
import {
  authorizedWorkspaceRequest,
  notMemberWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listMembers: vi.fn(),
  addMember: vi.fn(),
  listCandidates: vi.fn(),
  replaceRoles: vi.fn(),
  grantOwner: vi.fn(),
  revokeOwner: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/access/query-handler/list-workspace-members.query-handler",
  () => ({ listWorkspaceMembers: mocks.listMembers }),
);
vi.mock(
  "@/server/workspace/access/command-handler/add-workspace-member.command-handler",
  () => ({ addWorkspaceMember: mocks.addMember }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-clerk-candidates.query-handler",
  () => ({ listClerkCandidates: mocks.listCandidates }),
);
vi.mock(
  "@/server/workspace/access/command-handler/replace-workspace-member-roles.command-handler",
  () => ({ replaceWorkspaceMemberRoles: mocks.replaceRoles }),
);
vi.mock(
  "@/server/workspace/access/command-handler/grant-workspace-owner.command-handler",
  () => ({ grantWorkspaceOwner: mocks.grantOwner }),
);
vi.mock(
  "@/server/workspace/access/command-handler/revoke-workspace-owner.command-handler",
  () => ({ revokeWorkspaceOwner: mocks.revokeOwner }),
);

const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  roles: [],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

function request(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest;
}

function jsonRequest(url: string, method: string, body: unknown): NextRequest {
  return request(url, {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const context = { params: Promise.resolve({ id: MEMBER.id }) };

const MANAGER_WITHOUT_READ = [Permission.MembersManage];

describe("members routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
  });

  it("GET answers 401 without session and 404 without membership", async () => {
    mocks.authenticate.mockResolvedValueOnce(unauthenticatedWorkspaceRequest());
    expect(
      (await GET(request("http://localhost/api/workspace/members"))).status,
    ).toBe(401);

    mocks.authenticate.mockResolvedValueOnce(notMemberWorkspaceRequest());
    expect(
      (await GET(request("http://localhost/api/workspace/members"))).status,
    ).toBe(404);
    expect(mocks.listMembers).not.toHaveBeenCalled();
  });

  it("GET requires members.read and returns the member list", async () => {
    mocks.authenticate.mockResolvedValueOnce(
      authorizedWorkspaceRequest(MANAGER_WITHOUT_READ),
    );
    expect(
      (await GET(request("http://localhost/api/workspace/members"))).status,
    ).toBe(403);

    mocks.listMembers.mockResolvedValue([MEMBER]);
    const response = await GET(
      request("http://localhost/api/workspace/members"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ members: [MEMBER] });
  });

  it("POST requires members.manage", async () => {
    mocks.authenticate.mockResolvedValueOnce(
      authorizedWorkspaceRequest([Permission.MembersRead]),
    );

    const response = await POST(
      jsonRequest("http://localhost/api/workspace/members", "POST", {}),
    );

    expect(response.status).toBe(403);
    expect(mocks.addMember).not.toHaveBeenCalled();
  });

  it("POST answers 400 for a malformed body and 201 for a created member", async () => {
    const malformed = await POST(
      request("http://localhost/api/workspace/members", {
        method: "POST",
        body: "{",
      }),
    );
    expect(malformed.status).toBe(400);

    mocks.addMember.mockResolvedValue({ ok: true, member: MEMBER });
    const created = await POST(
      jsonRequest("http://localhost/api/workspace/members", "POST", {
        clerkUserId: "user_abc",
        roleIds: [],
      }),
    );
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ member: MEMBER });
  });

  it.each([
    [WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked, 409],
    [WorkspaceMemberErrorCode.ClerkAccountNotFound, 404],
    [WorkspaceMemberErrorCode.OwnerRoleNotAssignable, 422],
    [WorkspaceMemberErrorCode.ClerkUnavailable, 503],
  ])("POST maps %s to %i", async (code, status) => {
    mocks.addMember.mockResolvedValue({ ok: false, code });

    const response = await POST(
      jsonRequest("http://localhost/api/workspace/members", "POST", {}),
    );

    expect(response.status).toBe(status);
    expect((await response.json()).error).toBe(code);
  });

  it("POST clerk-candidates reads a trimmed body without putting PII in the URL", async () => {
    mocks.listCandidates.mockResolvedValueOnce({ ok: true, candidates: [] });
    const ok = await getCandidates(
      jsonRequest(
        "http://localhost/api/workspace/members/clerk-candidates",
        "POST",
        { query: " anna " },
      ),
    );
    expect(ok.status).toBe(200);
    expect(mocks.listCandidates).toHaveBeenCalledWith("anna");

    mocks.listCandidates.mockResolvedValueOnce({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkUnavailable,
    });
    const outage = await getCandidates(
      jsonRequest(
        "http://localhost/api/workspace/members/clerk-candidates",
        "POST",
        { query: "" },
      ),
    );
    expect(outage.status).toBe(503);
    expect(mocks.listCandidates).toHaveBeenLastCalledWith(null);
  });

  it("POST clerk-candidates rejects malformed and overlong search bodies", async () => {
    const malformed = await getCandidates(
      request("http://localhost/api/workspace/members/clerk-candidates", {
        method: "POST",
        body: "{",
      }),
    );
    const overlong = await getCandidates(
      jsonRequest(
        "http://localhost/api/workspace/members/clerk-candidates",
        "POST",
        { query: "a".repeat(101) },
      ),
    );

    expect(malformed.status).toBe(400);
    expect(overlong.status).toBe(400);
    expect(mocks.listCandidates).not.toHaveBeenCalled();
  });

  it("PUT roles returns the version conflict body with the current member", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 3,
      current: MEMBER,
    };
    mocks.replaceRoles.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });

    const response = await replaceRoles(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1/roles",
        "PUT",
        {
          roleIds: [],
          version: 1,
        },
      ),
      context,
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(conflict);
    expect(mocks.replaceRoles).toHaveBeenCalledWith(
      MEMBER.id,
      { roleIds: [], version: 1 },
      expect.objectContaining({ userId: expect.any(String) }),
    );
  });

  it("POST owner grants and DELETE owner maps the last owner protection to 409", async () => {
    mocks.grantOwner.mockResolvedValue({ ok: true, member: MEMBER });
    const granted = await grantOwner(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1/owner",
        "POST",
        {
          version: 2,
        },
      ),
      context,
    );
    expect(granted.status).toBe(200);

    mocks.revokeOwner.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.LastActiveOwner,
    });
    const revoked = await revokeOwner(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1/owner",
        "DELETE",
        {
          version: 2,
        },
      ),
      context,
    );
    expect(revoked.status).toBe(409);
    expect((await revoked.json()).error).toBe(
      WorkspaceMemberErrorCode.LastActiveOwner,
    );
  });

  it("answers 500 without leaking details and logs operation and constraint when a handler throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.replaceRoles.mockRejectedValue(
      new Error("database exploded", {
        cause: {
          code: "23503",
          constraint: "workspace_member_roles_assigned_by_user_id_fkey",
        },
      }),
    );

    const response = await replaceRoles(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1/roles",
        "PUT",
        {},
      ),
      context,
    );

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("exploded");
    expect(consoleError).toHaveBeenCalledWith(
      "[workspace-access] request failed",
      {
        operation: "members.roles.replace",
        errorName: "Error",
        postgresCode: "23503",
        constraint: "workspace_member_roles_assigned_by_user_id_fkey",
      },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("exploded");
    consoleError.mockRestore();
  });
});
