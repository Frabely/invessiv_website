import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { portalAccessApiService } from "./portal-access-api-service";

describe("portalAccessApiService", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("passes an authorization error to the UI", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { ok: false, error: AuthErrorCode.Forbidden },
            { status: 403 },
          ),
        ),
    );

    const result =
      await portalAccessApiService.revokeMembership("membership-id");
    expect(result).toEqual({ ok: false, code: AuthErrorCode.Forbidden });
  });

  it("passes a domain error to the UI", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { ok: false, code: PortalAccessErrorCode.InvalidPortalRole },
            { status: 422 },
          ),
        ),
    );

    const result =
      await portalAccessApiService.revokeMembership("membership-id");
    expect(result).toEqual({
      ok: false,
      code: PortalAccessErrorCode.InvalidPortalRole,
    });
  });

  it("identifies an empty 404 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    const result =
      await portalAccessApiService.revokeMembership("membership-id");
    expect(result).toEqual({ ok: false, code: PortalAccessErrorCode.NotFound });
  });
});
