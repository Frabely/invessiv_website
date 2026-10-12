import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ServiceRequestErrorCode as E } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PATCH } from "@/app/api/workspace/crm/service-requests/[requestId]/status/route";
import { POST } from "@/app/api/workspace/crm/service-requests/[requestId]/accept/route";
import { authorizedWorkspaceRequest } from "@/server/tests/support/workspace-auth-fixtures";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  change: vi.fn(),
  accept: vi.fn(),
}));
vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/command-handler/change-service-request-status.command-handler",
  () => ({ changeServiceRequestStatus: mocks.change }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/accept-service-request.command-handler",
  () => ({ acceptServiceRequest: mocks.accept }),
);
const context = {
  params: Promise.resolve({ requestId: serviceRequestFixture().id }),
};
function request(method: HttpMethod, body = "{}") {
  return new Request("http://localhost/api/workspace/crm/service-requests", {
    method,
    body,
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as NextRequest;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticate.mockResolvedValue(
    authorizedWorkspaceRequest([Permission.ServiceRequestsWrite]),
  );
});
describe("service request mutation routes", () => {
  it("requires the independent write permission before reading either body", async () => {
    mocks.authenticate.mockResolvedValue(
      authorizedWorkspaceRequest([Permission.ServiceRequestsRead]),
    );
    expect((await PATCH(request(HttpMethod.Patch, "{"), context)).status).toBe(
      H.Forbidden,
    );
    expect((await POST(request(HttpMethod.Post, "{"), context)).status).toBe(
      H.Forbidden,
    );
    expect(mocks.change).not.toHaveBeenCalled();
    expect(mocks.accept).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON as 422 without calling a command", async () => {
    expect((await PATCH(request(HttpMethod.Patch, "{"), context)).status).toBe(
      H.UnprocessableContent,
    );
    expect((await POST(request(HttpMethod.Post, "{"), context)).status).toBe(
      H.UnprocessableContent,
    );
    expect(mocks.change).not.toHaveBeenCalled();
    expect(mocks.accept).not.toHaveBeenCalled();
  });
  it("returns the DTO directly and marks both mutation responses private", async () => {
    const current = serviceRequestFixture();
    mocks.change.mockResolvedValue({ ok: true, request: current });
    mocks.accept.mockResolvedValue({ ok: true, request: current });
    for (const response of [
      await PATCH(request(HttpMethod.Patch), context),
      await POST(request(HttpMethod.Post), context),
    ]) {
      expect(response.status).toBe(H.Ok);
      expect(await response.json()).toEqual(current);
      expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
        "private, no-store",
      );
    }
  });
  it("returns a version conflict with the current version and full current request", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 3,
      current: serviceRequestFixture({ version: 3 }),
    };
    mocks.accept.mockResolvedValue({
      ok: false,
      code: E.VersionConflict,
      conflict,
    });
    const result = await POST(request(HttpMethod.Post), context);
    expect(result.status).toBe(H.Conflict);
    expect(await result.json()).toEqual(conflict);
  });
  it.each([
    [E.ServiceRequestNotFound, H.NotFound],
    [E.ProjectNotFound, H.NotFound],
    [E.ValidationError, H.UnprocessableContent],
    [E.KindMismatch, H.UnprocessableContent],
    [E.InvalidTransition, H.Conflict],
    [E.VersionConflict, H.Conflict],
    [E.TemplateNotAssignable, H.Conflict],
    [E.ProjectClosed, H.Conflict],
    [E.FeedbackRoundNotAvailable, H.Conflict],
    [E.EffectNotPermitted, H.Forbidden],
    [E.Internal, H.InternalServerError],
  ])("maps %s to %i with private caching", async (code, status) => {
    mocks.accept.mockResolvedValue({ ok: false, code });
    const result = await POST(request(HttpMethod.Post), context);
    expect(result.status).toBe(status);
    expect(await result.json()).toMatchObject({ error: code });
    expect(result.headers.get(HttpHeaderName.CacheControl)).toBe(
      "private, no-store",
    );
  });
});
