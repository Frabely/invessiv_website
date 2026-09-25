import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PUT } from "@/app/api/workspace/crm/portal-memberships/[id]/roles/route";
import { PATCH } from "@/app/api/workspace/crm/portal-memberships/[id]/route";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/lib/auth/api", () => ({
  withCrmPermission:
    (
      _rule: unknown,
      handler: (request: NextRequest, actor: unknown) => Promise<Response>,
    ) =>
    (request: NextRequest) =>
      handler(request, { userId: "user", workspaceMemberId: "member" }),
}));
vi.mock(
  "@/server/workspace/crm/command-handler/update-portal-membership.command-handler",
  () => ({
    updatePortalMembership: mocks.update,
  }),
);

const context = { params: Promise.resolve({ id: "membership-id" }) };
const roleId = "13c64fe8-cea3-48ad-b99c-3774b878b31f";

function request(method: HttpMethod, body: unknown): NextRequest {
  return new Request(
    "http://localhost/api/workspace/crm/portal-memberships/membership-id",
    {
      method,
      headers: { [HttpHeaderName.ContentType]: MediaType.Json },
      body: JSON.stringify(body),
    },
  ) as NextRequest;
}

describe("portal membership routes", () => {
  beforeEach(() => mocks.update.mockReset());

  it("returns a version conflict DTO while preserving the submitted role set", async () => {
    const current = {
      id: "membership-id",
      version: 4,
      emailNotificationsEnabled: true,
    };
    mocks.update.mockResolvedValue({
      ok: false,
      code: "version_conflict",
      conflict: { code: "version_conflict", currentVersion: 4, current },
    });
    const input = { version: 3, roleIds: [roleId] };
    const response = await PUT(request(HttpMethod.Put, input), context);
    expect(response.status).toBe(HttpResponseCode.Conflict);
    expect(await response.json()).toEqual({
      code: "version_conflict",
      currentVersion: 4,
      current,
    });
    expect(mocks.update).toHaveBeenCalledWith(
      "membership-id",
      input,
      expect.anything(),
    );
  });

  it("passes the versioned mail preference to the command", async () => {
    mocks.update.mockResolvedValue({
      ok: true,
      membership: {
        id: "membership-id",
        version: 5,
        emailNotificationsEnabled: false,
      },
    });
    const input = { version: 4, emailNotificationsEnabled: false };
    const response = await PATCH(request(HttpMethod.Patch, input), context);
    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(mocks.update).toHaveBeenCalledWith(
      "membership-id",
      input,
      expect.anything(),
    );
  });

  it.each([
    { code: "not_found", status: HttpResponseCode.NotFound },
    { code: "invalid_roles", status: HttpResponseCode.BadRequest },
  ])(
    "maps $code consistently in both membership routes",
    async ({ code, status }) => {
      mocks.update.mockResolvedValue({ ok: false, code });

      const patchResponse = await PATCH(
        request(HttpMethod.Patch, {
          version: 1,
          emailNotificationsEnabled: true,
        }),
        context,
      );
      const putResponse = await PUT(
        request(HttpMethod.Put, { version: 1, roleIds: [roleId] }),
        context,
      );

      expect(patchResponse.status).toBe(status);
      expect(putResponse.status).toBe(status);
      expect(await patchResponse.json()).toEqual({ code });
      expect(await putResponse.json()).toEqual({ code });
    },
  );
});
