import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  ServiceRequestErrorCode as E,
  SERVICE_REQUEST_ERROR_CODE_VALUES,
} from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";
import { serviceRequestsApiService } from "./service-requests-api-service";

function response(status: number, payload: unknown) {
  const fetch = vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify(payload), { status }),
    );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
afterEach(() => vi.unstubAllGlobals());
const OFFER = {
  to: S.Offered,
  version: 1,
  priceCents: 12500,
  minutes: null,
};
describe("serviceRequestsApiService", () => {
  it("uses a PATCH for status changes and returns current data for the status dialogs", async () => {
    const current = serviceRequestFixture({ status: S.Declined, version: 2 });
    const fetch = response(200, current);
    const input = {
      to: S.Declined,
      version: 1,
      reason: "Customer-visible reason",
    };
    expect(
      await serviceRequestsApiService.changeStatus(current.id, input),
    ).toEqual({
      ok: true,
      current,
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/workspace/crm/service-requests/" + current.id + "/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    );
    expect(
      await serviceRequestsApiService.changeStatus(current.id, OFFER),
    ).toEqual({ ok: true, current });
  });
  it("distinguishes a real version conflict from a terminal transition failure", async () => {
    const current = serviceRequestFixture({ status: S.Offered, version: 2 });
    response(409, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 2,
      current,
    });
    expect(
      await serviceRequestsApiService.changeStatus(current.id, {
        to: S.Declined,
        version: 1,
        reason: "Reason",
      }),
    ).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
    response(409, { error: E.InvalidTransition });
    expect(
      await serviceRequestsApiService.changeStatus(current.id, OFFER),
    ).toEqual({
      ok: false,
      code: E.InvalidTransition,
    });
  });
  it("keeps every known business failure and converts malformed or offline responses to INTERNAL", async () => {
    for (const code of SERVICE_REQUEST_ERROR_CODE_VALUES) {
      response(422, { error: code });
      expect(
        await serviceRequestsApiService.changeStatus("request", OFFER),
      ).toEqual({ ok: false, code });
    }
    response(200, { success: true });
    expect(
      await serviceRequestsApiService.changeStatus("request", OFFER),
    ).toEqual({ ok: false, code: E.Internal });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(
      await serviceRequestsApiService.changeStatus("request", OFFER),
    ).toEqual({ ok: false, code: E.Internal });
  });
});
