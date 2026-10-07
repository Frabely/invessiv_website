import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
import { versionedJsonMutationService as service } from "./versioned-json-mutation-service";
import { credentialsApiService } from "@/client/crm/credentials-api-service";
import { filesApiService } from "@/client/crm/files-api-service";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { credentialFixture } from "@/common/patterns/testing/credential-fixture";

const codes = Object.values(E);
const decode = (payload: unknown) =>
  readApiErrorCode(payload, codes, E.Internal);
const isCurrent = (value: unknown): value is { id: string } =>
  service.isRecord(value) && typeof value.id === "string";
const read = (value: unknown) => (isCurrent(value) ? value : null);
function response(status: number, payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(
        async () => new Response(JSON.stringify(payload), { status }),
      ),
  );
}
afterEach(() => vi.unstubAllGlobals());

describe("versioned JSON transport", () => {
  it("connects credential and file clients to their own error decoder", async () => {
    response(422, { code: E.Validation });
    expect(await credentialsApiService.remove("c1", 1)).toEqual({
      ok: false,
      code: E.Validation,
    });
    response(422, { code: FileApiErrorCode.ArchiveLimit });
    expect(await filesApiService.deleteFile("f1", 1)).toEqual({
      ok: false,
      code: FileApiErrorCode.ArchiveLimit,
    });
  });

  it("returns the current credential and file DTO on real client conflicts", async () => {
    const current = credentialFixture({ version: 2 });
    response(409, { code: ConcurrencyErrorCode.VersionConflict, current });
    expect(await credentialsApiService.remove(current.id, 1)).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
    const file = { id: "f1", displayName: "Example", version: 2 };
    response(409, {
      code: ConcurrencyErrorCode.VersionConflict,
      current: file,
    });
    expect(
      await filesApiService.updateFile("f1", {
        version: 1,
      }),
    ).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: file,
    });
  });
  it("keeps legacy error envelopes and explicit code decoders distinct", async () => {
    response(422, { error: E.Validation });
    expect(
      await service.mutate(
        "/test",
        HttpMethod.Patch,
        {},
        read,
        isCurrent,
        codes,
        E.Internal,
      ),
    ).toEqual({ ok: false, code: E.Validation });
    response(422, { code: E.Validation });
    expect(
      await service.mutate(
        "/test",
        HttpMethod.Patch,
        {},
        read,
        isCurrent,
        codes,
        E.Internal,
        decode,
      ),
    ).toEqual({ ok: false, code: E.Validation });
    expect(
      await service.request(
        "/test",
        HttpMethod.Post,
        {},
        read,
        decode,
        E.Internal,
      ),
    ).toEqual({ ok: false, code: E.Validation });
  });
  it("accepts delete success without a DTO or JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    expect(
      await service.remove(
        "/test",
        { version: 1 },
        isCurrent,
        decode,
        E.Internal,
      ),
    ).toEqual({ ok: true });
  });
  it("preserves a valid conflict and rejects malformed conflict state", async () => {
    response(409, {
      code: ConcurrencyErrorCode.VersionConflict,
      current: { id: "c1" },
    });
    expect(
      await service.remove(
        "/test",
        { version: 1 },
        isCurrent,
        decode,
        E.Internal,
      ),
    ).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: { id: "c1" },
    });
    response(409, {
      code: ConcurrencyErrorCode.VersionConflict,
      current: null,
    });
    expect(
      await service.remove(
        "/test",
        { version: 1 },
        isCurrent,
        decode,
        E.Internal,
      ),
    ).toEqual({ ok: false, code: E.Internal });
  });
  it("fails closed for invalid success payloads and network failures", async () => {
    response(200, { unexpected: true });
    expect(
      await service.request(
        "/test",
        HttpMethod.Get,
        undefined,
        read,
        decode,
        E.Internal,
      ),
    ).toEqual({ ok: false, code: E.Internal });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(
      await service.remove(
        "/test",
        { version: 1 },
        isCurrent,
        decode,
        E.Internal,
      ),
    ).toEqual({ ok: false, code: E.Internal });
  });
});
