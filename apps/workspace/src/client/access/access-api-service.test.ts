import { afterEach, describe, expect, it, vi } from "vitest";

import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { accessApiService } from "@/client/access/access-api-service";
import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import {
  accessCustomerProjectsEndpoint,
  accessCustomersEndpoint,
  crmCustomerAccessScopesEndpoint,
  workspaceMemberAccessScopeEndpoint,
  workspaceMemberAccessScopesEndpoint,
} from "@/common/patterns/access/access-api-endpoints";

function stubFetch(status: number, payload: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(payload), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("accessApiService", () => {
  it("sends the role replacement as PUT to the member roles endpoint", async () => {
    const member = { id: "member-1" };
    const fetchMock = stubFetch(HttpResponseCode.Ok, { member });

    const result = await accessApiService.replaceMemberRoles("member-1", {
      roleIds: [],
      version: 3,
    });

    expect(result).toEqual({ ok: true, member });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace/members/member-1/roles",
      expect.objectContaining({
        method: HttpMethod.Put,
        body: JSON.stringify({ roleIds: [], version: 3 }),
      }),
    );
  });

  it("returns the current state of a version conflict", async () => {
    const current = { id: "role-1", version: 4 };
    stubFetch(HttpResponseCode.Conflict, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 4,
      current,
    });

    const result = await accessApiService.updateRole("role-1", {
      name: "Sales",
      description: null,
      active: true,
      permissions: [],
      version: 3,
    });

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
  });

  it("maps a known error code and falls back to internal for unknown ones", async () => {
    stubFetch(HttpResponseCode.Conflict, {
      error: WorkspaceMemberErrorCode.LastActiveOwner,
    });
    expect(
      await accessApiService.revokeOwner("member-1", { version: 1 }),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.LastActiveOwner });

    stubFetch(HttpResponseCode.InternalServerError, { error: "SOMETHING_NEW" });
    expect(
      await accessApiService.createRole({
        name: "Sales",
        description: null,
        permissions: [],
        scopeAssignable: false,
      }),
    ).toEqual({ ok: false, code: RoleErrorCode.Internal });
  });

  it("reports a network failure as internal error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    expect(
      await accessApiService.listClerkCandidates({ query: "anna" }),
    ).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.Internal,
    });
  });

  it("sends Clerk search input in a POST body instead of the URL", async () => {
    const fetchMock = stubFetch(HttpResponseCode.Ok, { candidates: [] });

    await accessApiService.listClerkCandidates({ query: "anna@example.test" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace/members/clerk-candidates",
      expect.objectContaining({
        method: HttpMethod.Post,
        body: JSON.stringify({ query: "anna@example.test" }),
      }),
    );
    expect(fetchMock.mock.calls[0]?.[0]).not.toContain("anna@example.test");
  });

  it("sends a status PATCH and preserves exhaustive responsibility counts", async () => {
    const fetchMock = stubFetch(HttpResponseCode.Conflict, {
      error: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      details: {
        responsibilityCounts: {
          [OwnableEntity.Customer]: 2,
          [OwnableEntity.Task]: 3,
        },
      },
    });

    const result = await accessApiService.updateMemberStatus("member-1", {
      active: false,
      version: 3,
    });

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      responsibilityCounts: {
        [OwnableEntity.Customer]: 2,
        [OwnableEntity.Task]: 3,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace/members/member-1",
      expect.objectContaining({
        method: HttpMethod.Patch,
        body: JSON.stringify({ active: false, version: 3 }),
      }),
    );
  });

  it("degrades a missing task count to zero instead of dropping the whole result", async () => {
    stubFetch(HttpResponseCode.Conflict, {
      error: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      details: {
        responsibilityCounts: {
          [OwnableEntity.Customer]: 2,
        },
      },
    });

    const result = await accessApiService.updateMemberStatus("member-1", {
      active: false,
      version: 3,
    });

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      responsibilityCounts: {
        [OwnableEntity.Customer]: 2,
        [OwnableEntity.Task]: 0,
      },
    });
  });

  it("degrades a missing customer count to zero instead of dropping the whole result", async () => {
    stubFetch(HttpResponseCode.Conflict, {
      error: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      details: {
        responsibilityCounts: {
          [OwnableEntity.Task]: 5,
        },
      },
    });

    const result = await accessApiService.updateMemberStatus("member-1", {
      active: false,
      version: 3,
    });

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      responsibilityCounts: {
        [OwnableEntity.Customer]: 0,
        [OwnableEntity.Task]: 5,
      },
    });
  });

  it("omits responsibility counts entirely when neither field is present", async () => {
    stubFetch(HttpResponseCode.Conflict, {
      error: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      details: { responsibilityCounts: {} },
    });

    const result = await accessApiService.updateMemberStatus("member-1", {
      active: false,
      version: 3,
    });

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      responsibilityCounts: undefined,
    });
  });

  it("sends the versioned payload and returns the granted scope", async () => {
    const accessScope = {
      id: "scope-1",
      roleId: "role-1",
      scope: { type: AccessScopeType.Customer, customerId: "customer-1" },
    };
    const member = { id: "member-1", version: 4 };
    const fetchMock = stubFetch(HttpResponseCode.Created, {
      accessScope,
      member,
    });

    await expect(
      accessApiService.grantAccessScope("member-1", {
        roleId: "role-1",
        scope: accessScope.scope,
        version: 3,
      }),
    ).resolves.toEqual({ ok: true, accessScope, member });
    expect(fetchMock).toHaveBeenCalledWith(
      workspaceMemberAccessScopesEndpoint("member-1"),
      expect.objectContaining({
        method: HttpMethod.Post,
        body: JSON.stringify({
          roleId: "role-1",
          scope: accessScope.scope,
          version: 3,
        }),
      }),
    );
  });

  it("replaces all access scopes with one versioned PUT request", async () => {
    const member = { id: "member-1", version: 4 };
    const assignments = [
      {
        roleId: "role-1",
        scope: {
          type: AccessScopeType.Customer,
          customerId: "customer-1",
        } as const,
      },
    ];
    const fetchMock = stubFetch(HttpResponseCode.Ok, { member });

    await expect(
      accessApiService.replaceAccessScopes("member-1", {
        assignments,
        version: 3,
      }),
    ).resolves.toEqual({ ok: true, member });
    expect(fetchMock).toHaveBeenCalledWith(
      workspaceMemberAccessScopesEndpoint("member-1"),
      expect.objectContaining({
        method: HttpMethod.Put,
        body: JSON.stringify({ assignments, version: 3 }),
      }),
    );
  });

  it("maps an access-scope conflict without losing current", async () => {
    const current = { id: "member-1", version: 8 };
    stubFetch(HttpResponseCode.Conflict, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 8,
      current,
    });

    await expect(
      accessApiService.revokeAccessScope("member-1", "scope-1", {
        version: 7,
      }),
    ).resolves.toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
  });

  it("surfaces every access-scope error code unchanged", async () => {
    const codes = [
      WorkspaceMemberErrorCode.AccessScopeAlreadyGranted,
      WorkspaceMemberErrorCode.AccessScopeNotAssignable,
      WorkspaceMemberErrorCode.AccessScopeProjectCustomerMismatch,
      WorkspaceMemberErrorCode.AccessScopeNotFound,
      WorkspaceMemberErrorCode.MemberWithoutRole,
    ];
    for (const code of codes) {
      stubFetch(HttpResponseCode.UnprocessableContent, { error: code });
      await expect(
        accessApiService.grantAccessScope("member-1", {
          roleId: "role-1",
          scope: {
            type: AccessScopeType.Customer,
            customerId: "customer-1",
          },
          version: 1,
        }),
      ).resolves.toEqual({ ok: false, code });
    }
  });

  it("builds every access path through the endpoint helpers", async () => {
    const fetchMock = stubFetch(HttpResponseCode.Ok, {
      accessScopes: [],
      customers: [],
      projects: [],
    });

    await accessApiService.listMemberAccessScopes("member/1");
    await accessApiService.listCustomerAccessScopes("customer/1");
    await accessApiService.listAccessCustomers("Nord & Süd");
    await accessApiService.listAccessCustomerProjects("customer/1");
    await accessApiService.revokeAccessScope("member/1", "scope/1", {
      version: 2,
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      workspaceMemberAccessScopesEndpoint("member/1"),
      crmCustomerAccessScopesEndpoint("customer/1"),
      accessCustomersEndpoint("Nord & Süd"),
      accessCustomerProjectsEndpoint("customer/1"),
      workspaceMemberAccessScopeEndpoint("member/1", "scope/1"),
    ]);
  });
});
