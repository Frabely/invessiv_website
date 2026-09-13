import { afterEach, describe, expect, it, vi } from "vitest";

import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { accessApiService } from "@/client/access/access-api-service";

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
    const fetchMock = stubFetch(200, { member });

    const result = await accessApiService.replaceMemberRoles("member-1", {
      roleIds: [],
      version: 3,
    });

    expect(result).toEqual({ ok: true, member });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace/members/member-1/roles",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ roleIds: [], version: 3 }),
      }),
    );
  });

  it("returns the current state of a version conflict", async () => {
    const current = { id: "role-1", version: 4 };
    stubFetch(409, {
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
    stubFetch(409, { error: WorkspaceMemberErrorCode.LastActiveOwner });
    expect(
      await accessApiService.revokeOwner("member-1", { version: 1 }),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.LastActiveOwner });

    stubFetch(500, { error: "SOMETHING_NEW" });
    expect(
      await accessApiService.createRole({
        name: "Sales",
        description: null,
        permissions: [],
      }),
    ).toEqual({ ok: false, code: RoleErrorCode.Internal });
  });

  it("reports a network failure as internal error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    expect(await accessApiService.listClerkCandidates("anna")).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.Internal,
    });
  });
});
