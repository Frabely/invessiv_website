import { afterEach, describe, expect, it, vi } from "vitest";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { portalCredentialFixture } from "@/common/patterns/testing/portal-credential-fixture";
import { portalCredentialsApiService } from "./portal-credentials-api-service";

afterEach(() => vi.unstubAllGlobals());

function respond(payload: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(payload), { status })),
  );
}

describe("portal credential mutation responses", () => {
  it("returns the updated DTO when metadata can still be read", async () => {
    const credential = portalCredentialFixture({ version: 2 });
    respond({ updated: true, credential });
    expect(
      await portalCredentialsApiService.update("customer", credential.id, {
        version: 1,
      }),
    ).toEqual({ ok: true, value: credential });
  });

  it("confirms an update without exposing metadata", async () => {
    respond({ updated: true, credential: null });
    expect(
      await portalCredentialsApiService.update("customer", "entry", {
        version: 1,
        title: "New",
      }),
    ).toEqual({ ok: true, value: null });
  });

  it.each([null, portalCredentialFixture({ version: 2 })])(
    "preserves a conflict and its version with current %s",
    async (current) => {
      respond(
        {
          code: ConcurrencyErrorCode.VersionConflict,
          currentVersion: 2,
          current,
        },
        409,
      );
      expect(
        await portalCredentialsApiService.update("customer", "entry", {
          version: 1,
        }),
      ).toEqual({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 2,
        current,
      });
    },
  );

  it.each([
    { updated: true },
    { updated: true, credential: {} },
    { updated: false, credential: null },
  ])("rejects a malformed confirmation %s", async (payload) => {
    respond(payload);
    expect(
      await portalCredentialsApiService.update("customer", "entry", {
        version: 1,
      }),
    ).toEqual({ ok: false, code: CredentialApiErrorCode.Internal });
  });

  it("does not treat a missing creation DTO as a metadata-free confirmation", async () => {
    respond({ created: true }, 201);
    expect(
      await portalCredentialsApiService.create("customer", {
        title: "New",
        projectId: null,
        credentialType: "other",
        secret: "test",
        url: null,
        username: null,
        note: null,
      }),
    ).toEqual({ ok: false, code: CredentialApiErrorCode.Internal });
  });
});
