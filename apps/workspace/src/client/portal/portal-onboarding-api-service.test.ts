import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import { portalOnboardingApiService } from "./portal-onboarding-api-service";

const request = { fieldId: "field-1", groupEntryId: null, values: ["Acme"] };

function respond(status: number, payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { [HttpHeaderName.ContentType]: MediaType.Json },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("portalOnboardingApiService", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("puts one slot to the answers endpoint and returns who saved when", async () => {
    const saved = { savedAt: "2026-10-01T10:00:00.000Z", savedByName: "Ada" };
    const fetchMock = respond(H.Ok, saved);

    expect(
      await portalOnboardingApiService.saveAnswer("c-1", "f-1", request),
    ).toEqual({ ok: true, value: saved });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/c-1/onboarding/f-1/answers",
      expect.objectContaining({
        method: HttpMethod.Put,
        body: JSON.stringify(request),
      }),
    );
  });

  it("reads the error code of a refused save", async () => {
    respond(H.Conflict, { code: E.Locked, message: "locked" });

    expect(
      await portalOnboardingApiService.saveAnswer("c-1", "f-1", request),
    ).toEqual({ ok: false, code: E.Locked });
  });

  it.each([
    ["an unknown code", () => respond(H.InternalServerError, { code: "x" })],
    ["a success without the expected shape", () => respond(H.Ok, {})],
    [
      "a network failure",
      () => vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("x"))),
    ],
  ])("treats %s as unavailable", async (_name, arrange) => {
    arrange();

    expect(
      await portalOnboardingApiService.saveAnswer("c-1", "f-1", request),
    ).toEqual({ ok: false, code: E.Unavailable });
  });

  it("posts the submission without a body and returns the summary", async () => {
    const summary = { id: "f-1", status: "submitted" };
    const fetchMock = respond(H.Ok, summary);

    expect(await portalOnboardingApiService.submit("c-1", "f-1")).toEqual({
      ok: true,
      value: summary,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/c-1/onboarding/f-1/submit",
      { method: HttpMethod.Post },
    );
  });

  it("names the missing fields of a refused submission", async () => {
    const missing = [
      { blockId: "b-1", fieldId: "field-1", groupEntryId: null },
      { blockId: 7 },
    ];
    respond(H.UnprocessableContent, { code: E.RequiredMissing, missing });

    expect(await portalOnboardingApiService.submit("c-1", "f-1")).toEqual({
      ok: false,
      code: E.RequiredMissing,
      missing: [missing[0]],
    });
  });
});
