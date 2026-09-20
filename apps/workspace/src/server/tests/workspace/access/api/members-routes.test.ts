import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
import { POST as getCandidates } from "@/app/api/workspace/members/clerk-candidates/route";
import { PATCH as updateStatus } from "@/app/api/workspace/members/[id]/route";
import {
  DELETE as revokeOwner,
  POST as grantOwner,
} from "@/app/api/workspace/members/[id]/owner/route";
import { PUT as replaceRoles } from "@/app/api/workspace/members/[id]/roles/route";
import { GET, POST } from "@/app/api/workspace/members/route";
import { AccessOperation } from "@/common/constants/access/access-operations";
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
  updateStatus: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/access/query-handler/list-workspace-member-options.query-handler",
  () => ({ listWorkspaceMemberOptions: mocks.listMembers }),
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
vi.mock(
  "@/server/workspace/access/command-handler/update-workspace-member-status.command-handler",
  () => ({ updateWorkspaceMemberStatus: mocks.updateStatus }),
);

const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  roles: [],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

const MEMBER_OPTION: WorkspaceMemberOptionDto = {
  id: "member-1",
  displayName: "Anna Beispiel",
};

function request(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest;
}

function jsonRequest(
  url: string,
  method: HttpMethod,
  body: unknown,
): NextRequest {
  return request(url, {
    method,
    body: JSON.stringify(body),
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
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
    ).toBe(HttpResponseCode.Unauthorized);

    mocks.authenticate.mockResolvedValueOnce(notMemberWorkspaceRequest());
    expect(
      (await GET(request("http://localhost/api/workspace/members"))).status,
    ).toBe(HttpResponseCode.NotFound);
    expect(mocks.listMembers).not.toHaveBeenCalled();
  });

  it("GET requires members.read and returns only the slim member options", async () => {
    mocks.authenticate.mockResolvedValueOnce(
      authorizedWorkspaceRequest(MANAGER_WITHOUT_READ),
    );
    expect(
      (await GET(request("http://localhost/api/workspace/members"))).status,
    ).toBe(HttpResponseCode.Forbidden);

    mocks.authenticate.mockResolvedValueOnce(
      authorizedWorkspaceRequest([Permission.MembersRead]),
    );
    mocks.listMembers.mockResolvedValue([MEMBER_OPTION]);
    const response = await GET(
      request("http://localhost/api/workspace/members"),
    );
    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(await response.json()).toEqual({ members: [MEMBER_OPTION] });
  });

  it("POST requires members.manage", async () => {
    mocks.authenticate.mockResolvedValueOnce(
      authorizedWorkspaceRequest([Permission.MembersRead]),
    );

    const response = await POST(
      jsonRequest(
        "http://localhost/api/workspace/members",
        HttpMethod.Post,
        {},
      ),
    );

    expect(response.status).toBe(HttpResponseCode.Forbidden);
    expect(mocks.addMember).not.toHaveBeenCalled();
  });

  it("POST answers 400 for a malformed body and 201 for a created member", async () => {
    const malformed = await POST(
      request("http://localhost/api/workspace/members", {
        method: HttpMethod.Post,
        body: "{",
      }),
    );
    expect(malformed.status).toBe(HttpResponseCode.BadRequest);

    mocks.addMember.mockResolvedValue({ ok: true, member: MEMBER });
    const created = await POST(
      jsonRequest("http://localhost/api/workspace/members", HttpMethod.Post, {
        clerkUserId: "user_abc",
        roleIds: [],
      }),
    );
    expect(created.status).toBe(HttpResponseCode.Created);
    expect(await created.json()).toEqual({ member: MEMBER });
  });

  it.each([
    [
      WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked,
      HttpResponseCode.Conflict,
    ],
    [WorkspaceMemberErrorCode.ClerkAccountNotFound, HttpResponseCode.NotFound],
    [
      WorkspaceMemberErrorCode.OwnerRoleNotAssignable,
      HttpResponseCode.UnprocessableContent,
    ],
    [
      WorkspaceMemberErrorCode.ClerkUnavailable,
      HttpResponseCode.ServiceUnavailable,
    ],
  ])("POST maps %s to %i", async (code, status) => {
    mocks.addMember.mockResolvedValue({ ok: false, code });

    const response = await POST(
      jsonRequest(
        "http://localhost/api/workspace/members",
        HttpMethod.Post,
        {},
      ),
    );

    expect(response.status).toBe(status);
    expect((await response.json()).error).toBe(code);
  });

  it("POST clerk-candidates reads a trimmed body without putting PII in the URL", async () => {
    mocks.listCandidates.mockResolvedValueOnce({ ok: true, candidates: [] });
    const ok = await getCandidates(
      jsonRequest(
        "http://localhost/api/workspace/members/clerk-candidates",
        HttpMethod.Post,
        { query: " anna " },
      ),
    );
    expect(ok.status).toBe(HttpResponseCode.Ok);
    expect(mocks.listCandidates).toHaveBeenCalledWith({ query: " anna " });

    mocks.listCandidates.mockResolvedValueOnce({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkUnavailable,
    });
    const outage = await getCandidates(
      jsonRequest(
        "http://localhost/api/workspace/members/clerk-candidates",
        HttpMethod.Post,
        { query: "" },
      ),
    );
    expect(outage.status).toBe(HttpResponseCode.ServiceUnavailable);
    expect(mocks.listCandidates).toHaveBeenLastCalledWith({ query: "" });
  });

  it("POST clerk-candidates rejects malformed JSON and maps handler validation errors", async () => {
    const malformed = await getCandidates(
      request("http://localhost/api/workspace/members/clerk-candidates", {
        method: HttpMethod.Post,
        body: "{",
      }),
    );
    expect(malformed.status).toBe(HttpResponseCode.BadRequest);
    expect(mocks.listCandidates).not.toHaveBeenCalled();

    mocks.listCandidates.mockResolvedValueOnce({
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: [],
    });
    const invalid = await getCandidates(
      jsonRequest(
        "http://localhost/api/workspace/members/clerk-candidates",
        HttpMethod.Post,
        { query: "a".repeat(101) },
      ),
    );

    expect(invalid.status).toBe(HttpResponseCode.BadRequest);
    expect(mocks.listCandidates).toHaveBeenCalledWith({
      query: "a".repeat(101),
    });
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
        HttpMethod.Put,
        {
          roleIds: [],
          version: 1,
        },
      ),
      context,
    );

    expect(response.status).toBe(HttpResponseCode.Conflict);
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
        HttpMethod.Post,
        {
          version: 2,
        },
      ),
      context,
    );
    expect(granted.status).toBe(HttpResponseCode.Ok);

    mocks.revokeOwner.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.LastActiveOwner,
    });
    const revoked = await revokeOwner(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1/owner",
        HttpMethod.Delete,
        {
          version: 2,
        },
      ),
      context,
    );
    expect(revoked.status).toBe(HttpResponseCode.Conflict);
    expect((await revoked.json()).error).toBe(
      WorkspaceMemberErrorCode.LastActiveOwner,
    );
  });

  it("PATCH status requires members.manage and returns the updated member", async () => {
    mocks.authenticate.mockResolvedValueOnce(
      authorizedWorkspaceRequest([Permission.MembersRead]),
    );
    const forbidden = await updateStatus(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1",
        HttpMethod.Patch,
        { active: false, version: 2 },
      ),
      context,
    );
    expect(forbidden.status).toBe(HttpResponseCode.Forbidden);
    expect(mocks.updateStatus).not.toHaveBeenCalled();

    mocks.authenticate.mockResolvedValueOnce(authorizedWorkspaceRequest());
    mocks.updateStatus.mockResolvedValueOnce({
      ok: true,
      member: { ...MEMBER, active: false, version: 3 },
    });
    const success = await updateStatus(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1",
        HttpMethod.Patch,
        { active: false, version: 2 },
      ),
      context,
    );
    expect(success.status).toBe(HttpResponseCode.Ok);
    expect(await success.json()).toEqual({
      member: { ...MEMBER, active: false, version: 3 },
    });
  });

  it("PATCH status preserves authentication fallbacks and rejects malformed JSON", async () => {
    mocks.authenticate.mockResolvedValueOnce(unauthenticatedWorkspaceRequest());
    const unauthenticated = await updateStatus(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1",
        HttpMethod.Patch,
        { active: false, version: 2 },
      ),
      context,
    );
    expect(unauthenticated.status).toBe(HttpResponseCode.Unauthorized);

    mocks.authenticate.mockResolvedValueOnce(notMemberWorkspaceRequest());
    const notMember = await updateStatus(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1",
        HttpMethod.Patch,
        { active: false, version: 2 },
      ),
      context,
    );
    expect(notMember.status).toBe(HttpResponseCode.NotFound);

    mocks.authenticate.mockResolvedValueOnce(authorizedWorkspaceRequest());
    const malformed = await updateStatus(
      request("http://localhost/api/workspace/members/member-1", {
        method: HttpMethod.Patch,
        body: "{",
      }),
      context,
    );
    expect(malformed.status).toBe(HttpResponseCode.BadRequest);
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it.each([
    WorkspaceMemberErrorCode.MemberNotFound,
    WorkspaceMemberErrorCode.MemberAlreadyActive,
    WorkspaceMemberErrorCode.MemberAlreadyInactive,
    WorkspaceMemberErrorCode.SelfDeactivation,
    WorkspaceMemberErrorCode.LastActiveOwner,
  ])("PATCH status maps %s through the member error contract", async (code) => {
    mocks.updateStatus.mockResolvedValueOnce({ ok: false, code });
    const response = await updateStatus(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1",
        HttpMethod.Patch,
        { active: false, version: 2 },
      ),
      context,
    );
    expect(response.status).toBe(
      code === WorkspaceMemberErrorCode.MemberNotFound
        ? HttpResponseCode.NotFound
        : HttpResponseCode.Conflict,
    );
    expect((await response.json()).error).toBe(code);
  });

  it("PATCH status exposes responsibility counts and version conflicts", async () => {
    mocks.updateStatus.mockResolvedValueOnce({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      responsibilityCounts: { [OwnableEntity.Customer]: 2 },
    });
    const blocked = await updateStatus(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1",
        HttpMethod.Patch,
        { active: false, version: 2 },
      ),
      context,
    );
    expect(blocked.status).toBe(HttpResponseCode.Conflict);
    expect(await blocked.json()).toMatchObject({
      error: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      details: { responsibilityCounts: { [OwnableEntity.Customer]: 2 } },
    });

    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 3,
      current: MEMBER,
    };
    mocks.updateStatus.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    const stale = await updateStatus(
      jsonRequest(
        "http://localhost/api/workspace/members/member-1",
        HttpMethod.Patch,
        { active: false, version: 1 },
      ),
      context,
    );
    expect(stale.status).toBe(HttpResponseCode.Conflict);
    expect(await stale.json()).toEqual(conflict);
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
        HttpMethod.Put,
        {},
      ),
      context,
    );

    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    expect(JSON.stringify(await response.json())).not.toContain("exploded");
    expect(consoleError).toHaveBeenCalledWith(
      "[workspace-access] request failed",
      {
        operation: AccessOperation.ReplaceMemberRoles,
        errorName: "Error",
        postgresCode: "23503",
        constraint: "workspace_member_roles_assigned_by_user_id_fkey",
      },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("exploded");
    consoleError.mockRestore();
  });
});
