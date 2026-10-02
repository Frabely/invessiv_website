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

describe("portalOnboardingApiService group entries, files and services", () => {
  afterEach(() => vi.unstubAllGlobals());

  const entries = [{ id: "e-1", fieldId: "field-1", position: 0 }];
  const saved = { savedAt: "2026-10-01T10:00:00.000Z", savedByName: "Ada" };
  const link = {
    id: "link-1",
    fieldId: "field-1",
    groupEntryId: null,
    position: 0,
    file: { id: "file-1", displayName: "Logo" },
  };

  it("posts a new group entry and returns the entries of the group", async () => {
    const fetchMock = respond(H.Ok, entries);
    const body = { id: "e-1", fieldId: "field-1" };

    expect(
      await portalOnboardingApiService.addGroupEntry("c-1", "f-1", body),
    ).toEqual({ ok: true, value: entries });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/c-1/onboarding/f-1/group-entries",
      expect.objectContaining({
        method: HttpMethod.Post,
        body: JSON.stringify(body),
      }),
    );
  });

  it("deletes a group entry by its id", async () => {
    const fetchMock = respond(H.Ok, []);

    expect(
      await portalOnboardingApiService.removeGroupEntry("c-1", "f-1", "e-1"),
    ).toEqual({ ok: true, value: [] });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/c-1/onboarding/f-1/group-entries/e-1",
      { method: HttpMethod.Delete },
    );
  });

  it("posts the direction of a move", async () => {
    const fetchMock = respond(H.Ok, entries);

    expect(
      await portalOnboardingApiService.moveGroupEntry("c-1", "f-1", "e-1", -1),
    ).toEqual({ ok: true, value: entries });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/c-1/onboarding/f-1/group-entries/e-1/move",
      expect.objectContaining({
        method: HttpMethod.Post,
        body: JSON.stringify({ direction: -1 }),
      }),
    );
  });

  it("posts an attachment and returns the link with its file", async () => {
    const fetchMock = respond(H.Ok, link);
    const body = { fieldId: "field-1", groupEntryId: null, fileId: "file-1" };

    expect(
      await portalOnboardingApiService.attachFile("c-1", "f-1", body),
    ).toEqual({ ok: true, value: link });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/c-1/onboarding/f-1/files",
      expect.objectContaining({
        method: HttpMethod.Post,
        body: JSON.stringify(body),
      }),
    );
  });

  it("reads why an attachment was refused", async () => {
    respond(H.UnprocessableContent, { code: E.NotAttachable });

    expect(
      await portalOnboardingApiService.attachFile("c-1", "f-1", {
        fieldId: "field-1",
        groupEntryId: null,
        fileId: "file-1",
      }),
    ).toEqual({ ok: false, code: E.NotAttachable });
  });

  it("deletes a file link by the id of the link", async () => {
    const fetchMock = respond(H.Ok, saved);

    expect(
      await portalOnboardingApiService.detachFile("c-1", "f-1", "link-1"),
    ).toEqual({ ok: true, value: saved });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/c-1/onboarding/f-1/files/link-1",
      { method: HttpMethod.Delete },
    );
  });

  it("posts the confirmation of the booked services with its remark", async () => {
    const fetchMock = respond(H.Ok, saved);

    expect(
      await portalOnboardingApiService.confirmServices("c-1", "f-1", "Passt."),
    ).toEqual({ ok: true, value: saved });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/c-1/onboarding/f-1/services-confirmation",
      expect.objectContaining({
        method: HttpMethod.Post,
        body: JSON.stringify({ confirmed: true, note: "Passt." }),
      }),
    );
  });

  it("treats an answer of unexpected shape as unavailable", async () => {
    respond(H.Ok, { entries });

    expect(
      await portalOnboardingApiService.addGroupEntry("c-1", "f-1", {
        id: "e-1",
        fieldId: "field-1",
      }),
    ).toEqual({ ok: false, code: E.Unavailable });
  });
});
