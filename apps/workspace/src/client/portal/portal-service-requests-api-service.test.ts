import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalServiceRequestErrorCode as E } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import type { CreatePortalServiceRequestDto } from "@invessiv/common/contracts/portal/create-portal-service-request.dto";
import { portalServiceRequestsApiService as api } from "./portal-service-requests-api-service";

afterEach(() => vi.unstubAllGlobals());

const REQUEST: CreatePortalServiceRequestDto = {
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  lineItemTemplateId: "22222222-2222-4222-8222-222222222222",
  title: null,
  note: "",
  requestedMinutes: null,
  projectWish: ServiceRequestProjectWish.Undecided,
  projectId: null,
};

function respond(payload: unknown, status: number = HttpResponseCode.Ok) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(payload), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("portalServiceRequestsApiService.createRequest", () => {
  it("posts the request to the company's endpoint and reports the confirmation", async () => {
    const fetchMock = respond({ created: true }, HttpResponseCode.Created);

    expect(await api.createRequest("c 1", REQUEST)).toEqual({
      ok: true,
      value: true,
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/portal/c%201/service-requests");
    expect(init.method).toBe(HttpMethod.Post);
    expect(JSON.parse(init.body)).toEqual(REQUEST);
  });

  it("passes the error code of a rejected request on", async () => {
    respond({ code: E.LimitReached }, HttpResponseCode.Conflict);

    expect(await api.createRequest("c-1", REQUEST)).toEqual({
      ok: false,
      code: E.LimitReached,
    });
  });

  it("treats an answer without confirmation and a network failure as internal", async () => {
    respond({});
    expect(await api.createRequest("c-1", REQUEST)).toEqual({
      ok: false,
      code: E.Internal,
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    expect(await api.createRequest("c-1", REQUEST)).toEqual({
      ok: false,
      code: E.Internal,
    });
  });
});

describe("portalServiceRequestsApiService.withdrawRequest", () => {
  it("posts to the withdraw endpoint of the request", async () => {
    const fetchMock = respond({ withdrawn: true });

    expect(await api.withdrawRequest("c-1", "r 1")).toEqual({
      ok: true,
      value: true,
    });
    expect(fetchMock.mock.calls[0]![0]).toBe(
      "/api/portal/c-1/service-requests/r%201/withdraw",
    );
  });

  it("reports a request the team already works on as locked", async () => {
    respond({ code: E.Locked }, HttpResponseCode.Conflict);

    expect(await api.withdrawRequest("c-1", "r-1")).toEqual({
      ok: false,
      code: E.Locked,
    });
  });
});
